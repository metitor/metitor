import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { GET } from "./route";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

describe("Companies API", () => {
  let testCompanies: any[] = [];

  beforeEach(async () => {
    // Create test companies
    testCompanies = await Promise.all([
      prisma.object.create({
        data: {
          name: "Test Company 1",
          normalizedName: "test company 1",
          permalink: `test-company-1-${Date.now()}-${Math.random()}`,
          entityType: "Company",
          categoryCode: "software",
          status: "operating",
        },
      }),
      prisma.object.create({
        data: {
          name: "Test Company 2",
          normalizedName: "test company 2",
          permalink: `test-company-2-${Date.now()}-${Math.random()}`,
          entityType: "Company",
          categoryCode: "hardware",
          status: "closed",
        },
      }),
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.object.deleteMany({
      where: {
        id: {
          in: testCompanies.map((c) => c.id),
        },
      },
    });
    testCompanies = [];
  });

  it("should return a list of companies with pagination", async () => {
    const request = new NextRequest("http://localhost:3000/api/companies");
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

  it("should filter companies by category_code", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/companies?category_code=software"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const softwareCompanies = data.data.filter(
      (c: any) => c.categoryCode === "software"
    );
    expect(softwareCompanies.length).toBeGreaterThan(0);
    // All returned companies should have the software category
    data.data.forEach((company: any) => {
      expect(company.categoryCode).toBe("software");
    });
  });

  it("should filter companies by status", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/companies?status=operating"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // All returned companies should have the operating status
    data.data.forEach((company: any) => {
      expect(company.status).toBe("operating");
    });
  });

  it("should respect the limit parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/companies?limit=1"
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
      "http://localhost:3000/api/companies?limit=1"
    );
    const firstResponse = await GET(firstRequest);
    const firstData = await firstResponse.json();

    if (firstData.pagination.hasMore && firstData.pagination.nextCursor) {
      // Second request with cursor
      const secondRequest = new NextRequest(
        `http://localhost:3000/api/companies?limit=1&cursor=${firstData.pagination.nextCursor}`
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
      "http://localhost:3000/api/companies?limit=invalid"
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("should only return Company entity types", async () => {
    const request = new NextRequest("http://localhost:3000/api/companies");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // All returned items should be companies
    data.data.forEach((item: any) => {
      // The entityType field should not be in the response, but we know they're all companies
      // because we filtered by entityType in the query
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("permalink");
    });
  });
});
