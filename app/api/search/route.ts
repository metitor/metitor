import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search for companies, investors, and people
 *     description: Performs case-insensitive search on entity names with relevance-based ordering
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Object'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid query parameter
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
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Validate query parameter
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // Sanitize input - Prisma handles SQL injection prevention through parameterized queries
    // We normalize the search term to match against normalized_name field
    const normalizedQuery = query.toLowerCase().trim();

    if (normalizedQuery.length === 0) {
      return NextResponse.json(
        { error: "Query cannot be empty" },
        { status: 400 }
      );
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Perform case-insensitive search on normalized_name
    // Using contains for partial matching
    // We'll fetch all matching results and sort them by relevance in memory
    const allResults = await prisma.object.findMany({
      where: {
        normalizedName: {
          contains: normalizedQuery,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        entityType: true,
        categoryCode: true,
        permalink: true,
        description: true,
        normalizedName: true,
      },
    });

    // Sort by relevance: exact matches first, then by name similarity
    const sortedResults = allResults.sort((a, b) => {
      const aLower = a.normalizedName.toLowerCase();
      const bLower = b.normalizedName.toLowerCase();
      const queryLower = normalizedQuery.toLowerCase();

      // Exact match gets highest priority
      const aExact = aLower === queryLower ? 0 : 1;
      const bExact = bLower === queryLower ? 0 : 1;

      if (aExact !== bExact) {
        return aExact - bExact;
      }

      // Starts with query gets second priority
      const aStarts = aLower.startsWith(queryLower) ? 0 : 1;
      const bStarts = bLower.startsWith(queryLower) ? 0 : 1;

      if (aStarts !== bStarts) {
        return aStarts - bStarts;
      }

      // Then sort by length (shorter is more relevant)
      if (a.name.length !== b.name.length) {
        return a.name.length - b.name.length;
      }

      // Finally, alphabetically
      return a.name.localeCompare(b.name);
    });

    // Apply pagination to sorted results
    const results = sortedResults
      .slice(skip, skip + limit)
      .map(({ normalizedName, ...rest }) => rest);

    // Total count is the length of all results
    const total = allResults.length;

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
