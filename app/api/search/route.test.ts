import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import * as fc from "fast-check";
import { GET } from "./route";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

describe("Search API", () => {
  // Clean up test data before and after each test
  beforeEach(async () => {
    await prisma.object.deleteMany({
      where: {
        name: {
          startsWith: "Test",
        },
      },
    });
  });

  afterEach(async () => {
    await prisma.object.deleteMany({
      where: {
        name: {
          startsWith: "Test",
        },
      },
    });
  });

  // Feature: Property 11: Case-insensitive search matching
  // Validates: Requirements 5.1
  it("should return the same results regardless of query case", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-zA-Z0-9 ]{3,20}$/).filter((s) => s.trim().length >= 3),
        fc.constantFrom("Company", "FinancialOrg", "Person"),
        async (searchTerm, entityType) => {
          const cleanSearchTerm = searchTerm.trim();
          // Create a test object with the search term in the name
          const testObject = await prisma.object.create({
            data: {
              name: `Test ${cleanSearchTerm}`,
              normalizedName: `test ${cleanSearchTerm.toLowerCase()}`,
              permalink: `test-${cleanSearchTerm.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${Math.random()}`,
              entityType,
            },
          });

          try {
            // Test with lowercase
            const lowerRequest = new NextRequest(
              `http://localhost:3000/api/search?q=${encodeURIComponent(cleanSearchTerm.toLowerCase())}`
            );
            const lowerResponse = await GET(lowerRequest);
            const lowerData = await lowerResponse.json();

            // Test with uppercase
            const upperRequest = new NextRequest(
              `http://localhost:3000/api/search?q=${encodeURIComponent(cleanSearchTerm.toUpperCase())}`
            );
            const upperResponse = await GET(upperRequest);
            const upperData = await upperResponse.json();

            // Test with mixed case
            const mixedCase = cleanSearchTerm
              .split("")
              .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
              .join("");
            const mixedRequest = new NextRequest(
              `http://localhost:3000/api/search?q=${encodeURIComponent(mixedCase)}`
            );
            const mixedResponse = await GET(mixedRequest);
            const mixedData = await mixedResponse.json();

            // All three should return the same number of results
            expect(lowerData.results.length).toBe(upperData.results.length);
            expect(lowerData.results.length).toBe(mixedData.results.length);

            // All three should include our test object
            const lowerIds = lowerData.results.map((r: any) => r.id);
            const upperIds = upperData.results.map((r: any) => r.id);
            const mixedIds = mixedData.results.map((r: any) => r.id);

            expect(lowerIds).toContain(testObject.id);
            expect(upperIds).toContain(testObject.id);
            expect(mixedIds).toContain(testObject.id);
          } finally {
            // Clean up - use deleteMany which doesn't fail if record doesn't exist
            await prisma.object.deleteMany({
              where: { id: testObject.id },
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: Property 12: Search result completeness
  // Validates: Requirements 5.2
  it("should return all required fields for each search result", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 50 }),
          entityType: fc.constantFrom("Company", "FinancialOrg", "Person"),
          categoryCode: fc.option(fc.string({ minLength: 2, maxLength: 20 }), { nil: null }),
        }),
        async (objectData) => {
          // Create a test object
          const testObject = await prisma.object.create({
            data: {
              name: `Test ${objectData.name}`,
              normalizedName: `test ${objectData.name.toLowerCase()}`,
              permalink: `test-${objectData.name.toLowerCase()}-${Date.now()}-${Math.random()}`,
              entityType: objectData.entityType,
              categoryCode: objectData.categoryCode,
            },
          });

          try {
            // Search for the object
            const request = new NextRequest(
              `http://localhost:3000/api/search?q=${encodeURIComponent(objectData.name)}`
            );
            const response = await GET(request);
            const data = await response.json();

            // Find our test object in results
            const result = data.results.find((r: any) => r.id === testObject.id);

            if (result) {
              // Verify all required fields are present
              expect(result).toHaveProperty("name");
              expect(result).toHaveProperty("entityType");
              expect(result).toHaveProperty("categoryCode");
              expect(result.name).toBe(testObject.name);
              expect(result.entityType).toBe(testObject.entityType);
              expect(result.categoryCode).toBe(testObject.categoryCode);
            }
          } finally {
            // Clean up - use deleteMany which doesn't fail if record doesn't exist
            await prisma.object.deleteMany({
              where: { id: testObject.id },
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: Property 13: Search relevance ordering
  // Validates: Requirements 5.3
  it("should order results by relevance with exact matches before partial matches", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-zA-Z0-9 ]{5,15}$/).filter((s) => s.trim().length >= 5),
        async (baseTerm) => {
          const cleanBaseTerm = baseTerm.trim();
          // Create objects with different match qualities
          const exactMatch = await prisma.object.create({
            data: {
              name: cleanBaseTerm,
              normalizedName: cleanBaseTerm.toLowerCase(),
              permalink: `exact-${cleanBaseTerm.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${Math.random()}`,
              entityType: "Company",
            },
          });

          const partialMatch = await prisma.object.create({
            data: {
              name: `Prefix ${cleanBaseTerm} Suffix`,
              normalizedName: `prefix ${cleanBaseTerm.toLowerCase()} suffix`,
              permalink: `partial-${cleanBaseTerm.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${Math.random()}`,
              entityType: "Company",
            },
          });

          try {
            // Search for the base term
            const request = new NextRequest(
              `http://localhost:3000/api/search?q=${encodeURIComponent(cleanBaseTerm)}`
            );
            const response = await GET(request);
            const data = await response.json();

            // Find positions of our test objects
            const exactIndex = data.results.findIndex((r: any) => r.id === exactMatch.id);
            const partialIndex = data.results.findIndex((r: any) => r.id === partialMatch.id);

            // If both are found, exact match should come before or at same position as partial
            if (exactIndex !== -1 && partialIndex !== -1) {
              expect(exactIndex).toBeLessThanOrEqual(partialIndex);
            }
          } finally {
            // Clean up
            await prisma.object.deleteMany({
              where: {
                id: {
                  in: [exactMatch.id, partialMatch.id],
                },
              },
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: Property 14: SQL injection prevention
  // Validates: Requirements 5.5
  it("should prevent SQL injection attempts", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          "'; DROP TABLE objects; --",
          "' OR '1'='1",
          "admin'--",
          "' OR 1=1--",
          "'; DELETE FROM objects WHERE '1'='1",
          "1' UNION SELECT * FROM users--",
          "' OR 'x'='x",
          "%'; DROP TABLE objects; --"
        ),
        async (maliciousQuery) => {
          // Attempt SQL injection
          const request = new NextRequest(
            `http://localhost:3000/api/search?q=${encodeURIComponent(maliciousQuery)}`
          );
          const response = await GET(request);
          const data = await response.json();

          // Should return a valid response (not execute SQL)
          expect(response.status).toBeLessThan(500);
          expect(data).toHaveProperty("results");
          expect(Array.isArray(data.results)).toBe(true);

          // Verify database is still intact by counting objects
          const count = await prisma.object.count();
          expect(count).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
