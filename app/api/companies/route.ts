import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: List companies with pagination and filtering
 *     description: Returns a paginated list of companies with optional filtering by category and status
 *     tags:
 *       - Companies
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (company ID)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results per page
 *       - in: query
 *         name: category_code
 *         schema:
 *           type: string
 *         description: Filter by category code
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by company status
 *     responses:
 *       200:
 *         description: List of companies with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     nextCursor:
 *                       type: string
 *                       nullable: true
 *                     hasMore:
 *                       type: boolean
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20"),
      100
    );
    const categoryCode = searchParams.get("category_code");
    const status = searchParams.get("status");

    // Validate limit
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: "Invalid limit parameter" },
        { status: 400 }
      );
    }

    // Build where clause for filtering
    const where: any = {
      entityType: "Company",
    };

    if (categoryCode) {
      where.categoryCode = categoryCode;
    }

    if (status) {
      where.status = status;
    }

    // Build query with cursor-based pagination
    const queryOptions: any = {
      where,
      select: {
        id: true,
        name: true,
        permalink: true,
        categoryCode: true,
        status: true,
        foundedAt: true,
        closedAt: true,
        description: true,
        homepageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      take: limit + 1, // Fetch one extra to determine if there are more results
      orderBy: {
        createdAt: "desc",
      },
    };

    // Add cursor if provided
    if (cursor) {
      queryOptions.cursor = {
        id: cursor,
      };
      queryOptions.skip = 1; // Skip the cursor itself
    }

    // Execute query
    const results = await prisma.object.findMany(queryOptions);

    // Determine if there are more results
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({
      data,
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    });
  } catch (error) {
    console.error("Companies listing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
