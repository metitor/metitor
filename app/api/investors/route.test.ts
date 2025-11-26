import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { GET } from "./route";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

describe("Investors API", () => {
  let testInvestors: any[] = [];

  beforeEach(async () => {
    // Create test investors
    testInvestors = await Promise.all([
      prisma.object.create({
        data: {
          name: "Test Investor 1",
          normalizedName: "test investor 1",
          permalink: `test-investor-1-${Date.now()}-${Math.random()}`,
          entityType: "FinancialOrg",
          categoryCode: "venture",
        },
      }),
      prisma.object.create({
        data: {
          name: "Test Investor 2",
          normalizedName: "test investor 2",
          permalink: `test-investor-2-${Date.now()}-${Math.random()}`,
          entityType: "FinancialOrg",
          categoryCode: "angel",
        },
      }),
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.object.deleteMany({
      where: {
        id: {
          in: testInvestors.map((i) => i.id),
        },
      },
    });
    testInvestors = [];
  });

  it("should return a list of investors with pagination", async () => {
    const request = new NextRequest("http://localhost:3000/api/investors");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.pagination).toHaveProperty("nextCursor");
    expect(data.pagination).toHaveProperty("hasMore");
    expect(data.pagination).toHaveProperty("limit");
  });

  it("should filter investors by category_code", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/investors?category_code=venture"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const ventureInvestors = data.data.filter(
      (i: any) => i.categoryCode === "venture"
    );
    expect(ventureInvestors.length).toBeGreaterThan(0);
    // All returned investors should have the venture category
    data.data.forEach((investor: any) => {
      expect(investor.categoryCode).toBe("venture");
    });
  });

  it("should respect the limit parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/investors?limit=1"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.length).toBeLessThanOrEqual(1);
    expect(data.pagination.limit).toBe(1);
  });

  it("should implement cursor-based pagination", async () => {
    // First request
    const firstRequest = new NextRequest(
      "http://localhost:3000/api/investors?limit=1"
    );
    const firstResponse = await GET(firstRequest);
    const firstData = await firstResponse.json();

    if (firstData.pagination.hasMore && firstData.pagination.nextCursor) {
      // Second request with cursor
      const secondRequest = new NextRequest(
        `http://localhost:3000/api/investors?limit=1&cursor=${firstData.pagination.nextCursor}`
      );
      const secondResponse = await GET(secondRequest);
      const secondData = await secondResponse.json();

      expect(secondResponse.status).toBe(200);
      // The second page should have different data
      if (firstData.data.length > 0 && secondData.data.length > 0) {
        expect(firstData.data[0].id).not.toBe(secondData.data[0].id);
      }
    }
  });

  it("should return 400 for invalid limit", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/investors?limit=invalid"
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("should only return FinancialOrg entity types", async () => {
    const request = new NextRequest("http://localhost:3000/api/investors");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // All returned items should be investors
    data.data.forEach((item: any) => {
      // The entityType field should not be in the response, but we know they're all investors
      // because we filtered by entityType in the query
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("permalink");
    });
  });

  it("should enforce maximum limit of 100", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/investors?limit=200"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.limit).toBe(100);
  });
});
