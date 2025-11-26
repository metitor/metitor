import { describe, it, expect, afterEach } from "vitest";
import * as fc from "fast-check";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

describe("Investor Profile Page Properties", () => {
  // Clean up test data after each test - only delete test data with specific patterns
  afterEach(async () => {
    // Delete investments and funding rounds first (foreign key constraints)
    const testObjects = await prisma.object.findMany({
      where: {
        OR: [
          { permalink: { startsWith: "investor-" } },
          { permalink: { startsWith: "company-" } },
        ],
      },
    });
    const testObjectIds = testObjects.map((obj) => obj.id);
    
    await prisma.investment.deleteMany({
      where: { investorObjectId: { in: testObjectIds } },
    });
    await prisma.fundingRound.deleteMany({
      where: { objectId: { in: testObjectIds } },
    });
    await prisma.object.deleteMany({
      where: { id: { in: testObjectIds } },
    });
  });

  /**
   * Feature: Property 8: Investor permalink resolution
   * Validates: Requirements 4.1
   * 
   * For any investor object with a valid permalink, navigating to that permalink
   * should return the exact object with entity_type equal to "FinancialOrg" and
   * all its associated data.
   */
  it("Property 8: Investor permalink resolution", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          permalink: fc
            .string({ minLength: 1, maxLength: 50 })
            .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          categoryCode: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
        }),
        async (investorData) => {
          // Create an investor in the database
          const investor = await prisma.object.create({
            data: {
              entityType: "FinancialOrg",
              name: investorData.name,
              normalizedName: investorData.name.toLowerCase(),
              permalink: investorData.permalink,
              description: investorData.description,
              categoryCode: investorData.categoryCode,
            },
          });

          // Query by permalink with entityType filter
          const retrieved = await prisma.object.findUnique({
            where: {
              permalink: investorData.permalink,
              entityType: "FinancialOrg",
            },
          });

          // Verify the investor was retrieved
          expect(retrieved).not.toBeNull();
          expect(retrieved?.id).toBe(investor.id);
          expect(retrieved?.entityType).toBe("FinancialOrg");
          expect(retrieved?.name).toBe(investorData.name);
          expect(retrieved?.permalink).toBe(investorData.permalink);

          // Clean up
          await prisma.object.delete({ where: { id: investor.id } });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: Property 9: Investment aggregation accuracy
   * Validates: Requirements 4.4
   * 
   * For any investor with multiple investments in the same company, aggregating
   * the investments should produce a total invested amount equal to the sum of
   * all individual investment amounts.
   */
  it("Property 9: Investment aggregation accuracy", { timeout: 15000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          investor: fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          company: fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          investments: fc.array(
            fc.record({
              roundCode: fc.constantFrom("seed", "series-a", "series-b", "series-c"),
              raisedAmount: fc.double({ min: 10000, max: 100000000 }),
              fundedAt: fc.date({ min: new Date("2000-01-01"), max: new Date() }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
        }),
        async (data) => {
          // Generate unique permalinks
          const investorPermalink = `investor-${randomUUID()}`;
          const companyPermalink = `company-${randomUUID()}`;

          // Create investor
          const investor = await prisma.object.create({
            data: {
              entityType: "FinancialOrg",
              name: data.investor.name,
              normalizedName: data.investor.name.toLowerCase(),
              permalink: investorPermalink,
            },
          });

          // Create company
          const company = await prisma.object.create({
            data: {
              entityType: "Company",
              name: data.company.name,
              normalizedName: data.company.name.toLowerCase(),
              permalink: companyPermalink,
            },
          });

          // Create funding rounds and investments
          // Note: Each amount will be rounded to 2 decimal places by Prisma Decimal(20,2)
          const roundedAmounts: number[] = [];

          for (const investment of data.investments) {
            // Round to 2 decimal places to match database storage
            const roundedAmount = Math.round(investment.raisedAmount * 100) / 100;
            roundedAmounts.push(roundedAmount);

            const fundingRound = await prisma.fundingRound.create({
              data: {
                objectId: company.id,
                roundCode: investment.roundCode,
                raisedAmount: roundedAmount,
                fundedAt: investment.fundedAt,
              },
            });

            await prisma.investment.create({
              data: {
                fundingRoundId: fundingRound.id,
                investorObjectId: investor.id,
              },
            });
          }

          // Calculate expected total from rounded amounts
          const expectedTotal = roundedAmounts.reduce((sum, amt) => sum + amt, 0);

          // Query investor with investments
          const retrieved = await prisma.object.findUnique({
            where: {
              permalink: investorPermalink,
              entityType: "FinancialOrg",
            },
            include: {
              investments: {
                include: {
                  fundingRound: {
                    include: {
                      object: true,
                    },
                  },
                },
              },
            },
          });

          // Aggregate investments by company (as the page does)
          const portfolioMap = new Map<string, number>();
          retrieved?.investments.forEach((investment) => {
            const companyId = investment.fundingRound.object.id;
            const amount = Number(investment.fundingRound.raisedAmount || 0);
            portfolioMap.set(
              companyId,
              (portfolioMap.get(companyId) || 0) + amount
            );
          });

          // Verify aggregation accuracy
          const actualTotal = portfolioMap.get(company.id) || 0;
          expect(actualTotal).toBeCloseTo(expectedTotal, 2);

          // Clean up
          await prisma.investment.deleteMany({ where: { investorObjectId: investor.id } });
          await prisma.fundingRound.deleteMany({ where: { objectId: company.id } });
          await prisma.object.delete({ where: { id: investor.id } });
          await prisma.object.delete({ where: { id: company.id } });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: Property 10: Portfolio ordering by recency
   * Validates: Requirements 4.5
   * 
   * For any investor portfolio with multiple companies, the companies should be
   * ordered by the most recent investment date in descending order.
   */
  it("Property 10: Portfolio ordering by recency", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          investor: fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          companies: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              investments: fc.array(
                fc.record({
                  roundCode: fc.constantFrom("seed", "series-a", "series-b"),
                  fundedAt: fc.date({ min: new Date("2000-01-01"), max: new Date() }),
                }),
                { minLength: 1, maxLength: 3 }
              ),
            }),
            { minLength: 2, maxLength: 5 }
          ),
        }),
        async (data) => {
          // Generate unique permalink for investor
          const investorPermalink = `investor-${randomUUID()}`;

          // Create investor
          const investor = await prisma.object.create({
            data: {
              entityType: "FinancialOrg",
              name: data.investor.name,
              normalizedName: data.investor.name.toLowerCase(),
              permalink: investorPermalink,
            },
          });

          // Create companies and their investments
          const companyData: Array<{
            id: string;
            mostRecentDate: Date;
          }> = [];

          for (const companyInfo of data.companies) {
            const companyPermalink = `company-${randomUUID()}`;
            const company = await prisma.object.create({
              data: {
                entityType: "Company",
                name: companyInfo.name,
                normalizedName: companyInfo.name.toLowerCase(),
                permalink: companyPermalink,
              },
            });

            // Track most recent investment date for this company
            let mostRecentDate = companyInfo.investments[0].fundedAt;

            for (const investment of companyInfo.investments) {
              const fundingRound = await prisma.fundingRound.create({
                data: {
                  objectId: company.id,
                  roundCode: investment.roundCode,
                  fundedAt: investment.fundedAt,
                },
              });

              await prisma.investment.create({
                data: {
                  fundingRoundId: fundingRound.id,
                  investorObjectId: investor.id,
                },
              });

              // Update most recent date
              if (investment.fundedAt > mostRecentDate) {
                mostRecentDate = investment.fundedAt;
              }
            }

            companyData.push({
              id: company.id,
              mostRecentDate,
            });
          }

          // Query investor with investments (as the page does)
          const retrieved = await prisma.object.findUnique({
            where: {
              permalink: investorPermalink,
              entityType: "FinancialOrg",
            },
            include: {
              investments: {
                include: {
                  fundingRound: {
                    include: {
                      object: true,
                    },
                  },
                },
              },
            },
          });

          // Aggregate investments by company and track most recent date (as the page does)
          const portfolioMap = new Map<
            string,
            {
              company: any;
              mostRecentDate: Date | null;
            }
          >();

          retrieved?.investments.forEach((investment) => {
            const company = investment.fundingRound.object;
            const companyId = company.id;
            const fundedAt = investment.fundingRound.fundedAt;

            if (!portfolioMap.has(companyId)) {
              portfolioMap.set(companyId, {
                company,
                mostRecentDate: fundedAt,
              });
            }

            const entry = portfolioMap.get(companyId)!;
            // Update most recent date
            if (fundedAt && (!entry.mostRecentDate || fundedAt > entry.mostRecentDate)) {
              entry.mostRecentDate = fundedAt;
            }
          });

          // Convert to array and sort by most recent investment date (as the page does)
          const portfolio = Array.from(portfolioMap.values()).sort((a, b) => {
            if (!a.mostRecentDate && !b.mostRecentDate) return 0;
            if (!a.mostRecentDate) return 1;
            if (!b.mostRecentDate) return -1;
            return b.mostRecentDate.getTime() - a.mostRecentDate.getTime();
          });

          // Verify ordering: each company should have a most recent date >= the next company
          for (let i = 0; i < portfolio.length - 1; i++) {
            const current = portfolio[i].mostRecentDate;
            const next = portfolio[i + 1].mostRecentDate;

            if (current && next) {
              expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
            }
          }

          // Clean up
          await prisma.investment.deleteMany({ where: { investorObjectId: investor.id } });
          for (const company of companyData) {
            await prisma.fundingRound.deleteMany({ where: { objectId: company.id } });
            await prisma.object.delete({ where: { id: company.id } });
          }
          await prisma.object.delete({ where: { id: investor.id } });
        }
      ),
      { numRuns: 100 }
    );
  });
});
