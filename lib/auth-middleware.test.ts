import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import fc from "fast-check";
import { PrismaClient } from "@prisma/client";
import { verifySession, requireAuth } from "./auth-middleware";
import { auth } from "./auth";

const prisma = new PrismaClient();

// Generator for valid passwords (at least 8 chars, with letters and numbers)
const passwordArbitrary = fc.tuple(
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'), { minLength: 6, maxLength: 10 }),
  fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 2, maxLength: 4 })
).map(([letters, numbers]) => letters + numbers);

describe("Auth Middleware Property Tests", () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            contains: "test-pbt-",
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "test-pbt-",
        },
      },
    });
  });

  // Feature: Property 27: Protected route authorization
  // Validates: Requirements 9.3
  it("Property 27: For any protected route accessed with a valid, non-expired session token, the system should authorize the request", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 5, maxLength: 20 }).map((s) => `test-pbt-${s}`),
        passwordArbitrary,
        async (emailPrefix, password) => {
          const email = `${emailPrefix}@example.com`;

          // Delete any existing user with this email first
          await prisma.user.deleteMany({ where: { email } });

          try {
            // Create user using Better-Auth API
            const signUpResult = await auth.api.signUpEmail({
              body: {
                email,
                password,
              },
            });

            // Create a request with the valid session token
            const request = new NextRequest("http://localhost:3000/api/auth/me", {
              headers: {
                cookie: `better-auth.session_token=${signUpResult.session.token}`,
              },
            });

            // Verify the session
            const verification = await verifySession(request);

            // The session should be valid
            expect(verification.isValid).toBe(true);
            expect(verification.user).toBeDefined();
            expect(verification.user.email).toBe(email);
            expect(verification.session).toBeDefined();

            // Test requireAuth as well
            const authResult = await requireAuth(request);
            expect(authResult.success).toBe(true);
            if (authResult.success) {
              expect(authResult.user.email).toBe(email);
            }
          } finally {
            // Clean up
            await prisma.user.deleteMany({ where: { email } });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: Property 28: Expired session rejection
  // Validates: Requirements 9.4
  it("Property 28: For any request to a protected route with an expired session token, the system should reject the request", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 5, maxLength: 20 }).map((s) => `test-pbt-${s}`),
        passwordArbitrary,
        async (emailPrefix, password) => {
          const email = `${emailPrefix}@example.com`;

          // Delete any existing user with this email first
          await prisma.user.deleteMany({ where: { email } });

          try {
            // Create user using Better-Auth API
            const signUpResult = await auth.api.signUpEmail({
              body: {
                email,
                password,
              },
            });

            // Manually expire the session by updating the database
            await prisma.session.update({
              where: {
                token: signUpResult.session.token,
              },
              data: {
                expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
              },
            });

            // Create a request with the expired session token
            const request = new NextRequest("http://localhost:3000/api/auth/me", {
              headers: {
                cookie: `better-auth.session_token=${signUpResult.session.token}`,
              },
            });

            // Verify the session
            const verification = await verifySession(request);

            // The session should be invalid due to expiration
            expect(verification.isValid).toBe(false);
            expect(verification.error).toBeDefined();
            expect(verification.error).toContain("expired");

            // Test requireAuth as well
            const authResult = await requireAuth(request);
            expect(authResult.success).toBe(false);
          } finally {
            // Clean up
            await prisma.user.deleteMany({ where: { email } });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: Property 29: Logout session cleanup
  // Validates: Requirements 9.5
  it("Property 29: For any logout operation, the system should delete the session record such that the token is no longer valid", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 5, maxLength: 20 }).map((s) => `test-pbt-${s}`),
        passwordArbitrary,
        async (emailPrefix, password) => {
          const email = `${emailPrefix}@example.com`;

          // Delete any existing user with this email first
          await prisma.user.deleteMany({ where: { email } });

          try {
            // Create user using Better-Auth API
            const signUpResult = await auth.api.signUpEmail({
              body: {
                email,
                password,
              },
            });

            const sessionToken = signUpResult.session.token;

            // Verify the session exists and is valid before logout
            const requestBefore = new NextRequest("http://localhost:3000/api/auth/me", {
              headers: {
                cookie: `better-auth.session_token=${sessionToken}`,
              },
            });

            const verificationBefore = await verifySession(requestBefore);
            expect(verificationBefore.isValid).toBe(true);

            // Perform logout using Better-Auth API
            await auth.api.signOut({
              headers: requestBefore.headers,
            });

            // Try to use the session token after logout
            const requestAfter = new NextRequest("http://localhost:3000/api/auth/me", {
              headers: {
                cookie: `better-auth.session_token=${sessionToken}`,
              },
            });

            const verificationAfter = await verifySession(requestAfter);

            // The session should no longer be valid
            expect(verificationAfter.isValid).toBe(false);

            // Verify the session was actually deleted from the database
            const sessionInDb = await prisma.session.findUnique({
              where: {
                token: sessionToken,
              },
            });

            expect(sessionInDb).toBeNull();
          } finally {
            // Clean up
            await prisma.user.deleteMany({ where: { email } });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
