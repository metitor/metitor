import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Company Profile Page Properties", () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.fundingRound.deleteMany();
    await prisma.acquisition.deleteMany();
    await prisma.office.deleteMany();
    await prisma.object.deleteMany();
  });

  /**
   * Feature: Property 4: Company permalink resolution
   * Validates: Requirements 3.1
   * 
   * For any company object with a valid permalink, navigating to that permalink
   * should return the exact object with entity_type equal to "Company" and all
   * its associated data.
   */
  it("Property 4: Company permalink resolution", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          permalink: fc
            .string({ minLength: 1, maxLength: 50 })
            .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          categoryCode: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
          status: fc.option(fc.constantFrom("operating", "closed", "acquired"), {
            nil: null,
          }),
        }),
        async (companyData) => {
          // Create a company in the database
          const company = await prisma.object.create({
            data: {
              entityType: "Company",
              name: companyData.name,
              normalizedName: companyData.name.toLowerCase(),
              permalink: companyData.permalink,
              description: companyData.description,
              categoryCode: companyData.categoryCode,
              status: companyData.status,
            },
          });

          // Query by permalink with entityType filter
          const retrieved = await prisma.object.findUnique({
            where: {
              permalink: companyData.permalink,
              entityType: "Company",
            },
          });

          // Verify the company was retrieved
          expect(retrieved).not.toBeNull();
          expect(retrieved?.id).toBe(company.id);
          expect(retrieved?.entityType).toBe("Company");
          expect(retrieved?.name).toBe(companyData.name);
          expect(retrieved?.permalink).toBe(companyData.permalink);

          // Clean up
          await prisma.object.delete({ where: { id: company.id } });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: Property 5: Required fields presence in profiles
   * Validates: Requirements 3.2, 4.2
   * 
   * For any entity (company or investor) rendered in a profile view, the output
   * should contain all required fields specified for that entity type (name,
   * description, category_code, etc.).
   */
  it("Property 5: Required fields presence in profiles", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          permalink: fc
            .string({ minLength: 1, maxLength: 50 })
            .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          categoryCode: fc.string({ minLength: 1, maxLength: 50 }),
          status: fc.constantFrom("operating", "closed", "acquired"),
          foundedAt: fc.date({ min: new Date("1900-01-01"), max: new Date() }),
        }),
        async (companyData) => {
          // Create a company with all required fields
          const company = await prisma.object.create({
            data: {
              entityType: "Company",
              name: companyData.name,
              normalizedName: companyData.name.toLowerCase(),
              permalink: companyData.permalink,
              description: companyData.description,
              categoryCode: companyData.categoryCode,
              status: companyData.status,
              foundedAt: companyData.foundedAt,
            },
          });

          // Retrieve the company as the page would
          const retrieved = await prisma.object.findFirst({
            where: {
              permalink: companyData.permalink,
              entityType: "Company",
            },
          });

          // Verify all required fields are present
          expect(retrieved).not.toBeNull();
          expect(retrieved?.name).toBeDefined();
          expect(retrieved?.name).toBe(companyData.name);
          expect(retrieved?.description).toBeDefined();
          expect(retrieved?.description).toBe(companyData.description);
          expect(retrieved?.categoryCode).toBeDefined();
          expect(retrieved?.categoryCode).toBe(companyData.categoryCode);
          expect(retrieved?.status).toBeDefined();
          expect(retrieved?.foundedAt).toBeDefined();

          // Clean up
          await prisma.object.delete({ where: { id: company.id } });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: Property 6: Funding rounds ordering
   * Validates: Requirements 3.3
   * 
   * For any company with multiple funding rounds, querying the company's funding
   * history should return all rounds ordered by funded_at in descending order
   * (most recent first).
   */
  it("Property 6: Funding rounds ordering", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 100 }),
          permalink: fc
            .string({ minLength: 1, maxLength: 50 })
            .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
          fundingRounds: fc
            .array(
              fc.record({
                roundCode: fc.constantFrom("seed", "series-a", "series-b", "series-c"),
                raisedAmount: fc.double({ min: 10000, max: 100000000 }),
                fundedAt: fc.date({
                  min: new Date("2000-01-01"),
                  max: new Date(),
                }),
              }),
              { minLength: 2, maxLength: 5 }
            ),
        }),
        async (data) => {
          // Create company
          const company = await prisma.object.create({
            data: {
              entityType: "Company",
              name: data.companyName,
              normalizedName: data.companyName.toLowerCase(),
              permalink: data.permalink,
            },
          });

          // Create funding rounds
          for (const round of data.fundingRounds) {
            await prisma.fundingRound.create({
              data: {
                objectId: company.id,
                roundCode: round.roundCode,
                raisedAmount: round.raisedAmount,
                fundedAt: round.fundedAt,
              },
            });
          }

          // Query funding rounds as the page would
          const retrieved = await prisma.object.findUnique({
            where: {
              permalink: data.permalink,
              entityType: "Company",
            },
            include: {
              fundingRounds: {
                orderBy: {
                  fundedAt: "desc",
                },
              },
            },
          });

          // Verify ordering
          expect(retrieved).not.toBeNull();
          expect(retrieved?.fundingRounds.length).toBe(data.fundingRounds.length);

          // Check that rounds are ordered by fundedAt descending
          for (let i = 0; i < retrieved!.fundingRounds.length - 1; i++) {
            const current = retrieved!.fundingRounds[i].fundedAt;
            const next = retrieved!.fundingRounds[i + 1].fundedAt;
            
            if (current && next) {
              expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
            }
          }

          // Clean up
          await prisma.fundingRound.deleteMany({ where: { objectId: company.id } });
          await prisma.object.delete({ where: { id: company.id } });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: Property 7: Acquisition details completeness
   * Validates: Requirements 3.4
   * 
   * For any acquired company, the profile should include the acquisition record
   * with the acquiring company's name and details accessible through the relationship.
   */
  it("Property 7: Acquisition details completeness", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          acquiredCompany: fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            permalink: fc
              .string({ minLength: 1, maxLength: 50 })
              .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-") + "-acquired"),
          }),
          acquiringCompany: fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            permalink: fc
              .string({ minLength: 1, maxLength: 50 })
              .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-") + "-acquirer"),
          }),
          priceAmount: fc.option(fc.double({ min: 1000000, max: 10000000000 }), {
            nil: null,
          }),
          acquiredAt: fc.date({ min: new Date("2000-01-01"), max: new Date() }),
        }),
        async (data) => {
          // Create both companies
          const acquiredCompany = await prisma.object.create({
            data: {
              entityType: "Company",
              name: data.acquiredCompany.name,
              normalizedName: data.acquiredCompany.name.toLowerCase(),
              permalink: data.acquiredCompany.permalink,
              status: "acquired",
            },
          });

          const acquiringCompany = await prisma.object.create({
            data: {
              entityType: "Company",
              name: data.acquiringCompany.name,
              normalizedName: data.acquiringCompany.name.toLowerCase(),
              permalink: data.acquiringCompany.permalink,
            },
          });

          // Create acquisition record
          await prisma.acquisition.create({
            data: {
              acquiredObjectId: acquiredCompany.id,
              acquiringObjectId: acquiringCompany.id,
              priceAmount: data.priceAmount,
              acquiredAt: data.acquiredAt,
            },
          });

          // Query as the page would
          const retrieved = await prisma.object.findUnique({
            where: {
              permalink: data.acquiredCompany.permalink,
              entityType: "Company",
            },
            include: {
              acquisitionsAcquired: {
                include: {
                  acquiringObject: true,
                },
              },
            },
          });

          // Verify acquisition details are complete
          expect(retrieved).not.toBeNull();
          expect(retrieved?.acquisitionsAcquired.length).toBeGreaterThan(0);
          
          const acquisition = retrieved!.acquisitionsAcquired[0];
          expect(acquisition).toBeDefined();
          expect(acquisition.acquiringObject).toBeDefined();
          expect(acquisition.acquiringObject.name).toBe(data.acquiringCompany.name);
          expect(acquisition.acquiredAt).toBeDefined();

          // Clean up
          await prisma.acquisition.deleteMany({
            where: { acquiredObjectId: acquiredCompany.id },
          });
          await prisma.object.delete({ where: { id: acquiredCompany.id } });
          await prisma.object.delete({ where: { id: acquiringCompany.id } });
        }
      ),
      { numRuns: 100 }
    );
  });
});
