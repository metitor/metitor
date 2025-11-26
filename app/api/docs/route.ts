import { NextRequest, NextResponse } from "next/server";
import { getOpenAPISpec } from "@/lib/docs/openapi";

/**
 * GET /api/docs
 * Serve OpenAPI specification as JSON
 */
export async function GET(request: NextRequest) {
  try {
    const spec = getOpenAPISpec();
    return NextResponse.json(spec);
  } catch (error) {
    console.error("Error generating OpenAPI spec:", error);
    return NextResponse.json(
      { error: "Failed to generate API documentation" },
      { status: 500 }
    );
  }
}
