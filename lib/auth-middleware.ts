import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export interface SessionVerificationResult {
  isValid: boolean;
  session: any | null;
  user: any | null;
  error?: string;
}

/**
 * Middleware to verify session tokens for protected routes
 * Checks token validity and expiration
 */
export async function verifySession(request: NextRequest): Promise<SessionVerificationResult> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return {
        isValid: false,
        session: null,
        user: null,
        error: "No session found",
      };
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.session.expiresAt);
    
    if (expiresAt < now) {
      return {
        isValid: false,
        session: null,
        user: null,
        error: "Session expired",
      };
    }

    // Session is valid and not expired
    return {
      isValid: true,
      session: session.session,
      user: session.user,
    };
  } catch (error) {
    return {
      isValid: false,
      session: null,
      user: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper to require authentication for a route handler
 * Returns the session if valid, or an error response
 */
export async function requireAuth(request: NextRequest): Promise<
  | { success: true; session: any; user: any }
  | { success: false; response: NextResponse }
> {
  const verification = await verifySession(request);

  if (!verification.isValid) {
    return {
      success: false,
      response: unauthorizedResponse(verification.error || "Unauthorized"),
    };
  }

  return {
    success: true,
    session: verification.session,
    user: verification.user,
  };
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Helper to create forbidden response
 */
export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}
