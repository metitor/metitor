import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to simulate user registration
async function registerUser(email: string, password: string, name?: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      emailVerified: false,
    },
  });
  
  return user;
}

describe('Authentication Property Tests', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
  });

  // Feature: Property 25: User registration completeness
  it('should create complete user records with hashed passwords for any valid registration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 100 }),
          name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        async (userData) => {
          // Register the user
          const createdUser = await registerUser(userData.email, userData.password, userData.name);

          // Verify the user was created
          const user = await prisma.user.findUnique({
            where: { email: userData.email },
          });

          // Property: User record should exist
          expect(user).not.toBeNull();
          
          if (user) {
            // Property: Email should match
            expect(user.email).toBe(userData.email);
            
            // Property: Password should be hashed (not plaintext)
            expect(user.password).not.toBe(userData.password);
            expect(user.password.length).toBeGreaterThan(userData.password.length);
            
            // Verify password can be validated
            const isValidPassword = await bcrypt.compare(userData.password, user.password);
            expect(isValidPassword).toBe(true);
            
            // Property: createdAt timestamp should exist and be recent
            expect(user.createdAt).toBeInstanceOf(Date);
            const now = new Date();
            const timeDiff = now.getTime() - user.createdAt.getTime();
            expect(timeDiff).toBeGreaterThanOrEqual(0);
            expect(timeDiff).toBeLessThan(10000); // Within 10 seconds
            
            // Property: Name should match if provided
            if (userData.name) {
              expect(user.name).toBe(userData.name);
            }
          }

          // Clean up this specific user for next iteration
          await prisma.user.delete({
            where: { email: userData.email },
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 60000); // 60 second timeout for property-based test

  // Feature: Property 26: Session creation on login
  it('should create valid session records for any successful login', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 100 }),
          name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        async (userData) => {
          // First, register the user
          const user = await registerUser(userData.email, userData.password, userData.name);

          // Simulate login by creating a session
          const sessionToken = `session_${Math.random().toString(36).substring(2)}`;
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

          const session = await prisma.session.create({
            data: {
              userId: user.id,
              token: sessionToken,
              expiresAt,
              ipAddress: '127.0.0.1',
              userAgent: 'test-agent',
            },
          });

          // Verify the session was created
          const createdSession = await prisma.session.findUnique({
            where: { token: sessionToken },
          });

          // Property: Session record should exist
          expect(createdSession).not.toBeNull();
          
          if (createdSession) {
            // Property: Session should be linked to the correct user
            expect(createdSession.userId).toBe(user.id);
            
            // Property: Session token should match
            expect(createdSession.token).toBe(sessionToken);
            
            // Property: Session should have a valid expiration date in the future
            expect(createdSession.expiresAt).toBeInstanceOf(Date);
            expect(createdSession.expiresAt.getTime()).toBeGreaterThan(Date.now());
            
            // Property: Session should have createdAt timestamp
            expect(createdSession.createdAt).toBeInstanceOf(Date);
            const now = new Date();
            const timeDiff = now.getTime() - createdSession.createdAt.getTime();
            expect(timeDiff).toBeGreaterThanOrEqual(0);
            expect(timeDiff).toBeLessThan(10000); // Within 10 seconds
          }

          // Clean up
          await prisma.session.delete({
            where: { token: sessionToken },
          });
          await prisma.user.delete({
            where: { email: userData.email },
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 60000); // 60 second timeout for property-based test
});
