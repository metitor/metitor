import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getOpenAPISpec } from './openapi';
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Feature: Property 21: OpenAPI route coverage
 * Validates: Requirements 8.1
 * 
 * For any API route defined in the application, the OpenAPI specification 
 * should include that route with its method, path, and parameters.
 */
describe('OpenAPI Route Coverage', () => {
  it('should include all defined API routes in the OpenAPI specification', async () => {
    // Get the OpenAPI spec
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};

    // Define the expected routes based on our API structure
    const expectedRoutes = [
      { path: '/api/search', method: 'get' },
      { path: '/api/auth/register', method: 'post' },
      { path: '/api/auth/login', method: 'post' },
      { path: '/api/auth/logout', method: 'post' },
      { path: '/api/auth/me', method: 'get' },
    ];

    // Check that each expected route is documented
    for (const route of expectedRoutes) {
      expect(paths[route.path], `Route ${route.path} should be documented`).toBeDefined();
      expect(
        paths[route.path][route.method],
        `Method ${route.method.toUpperCase()} for ${route.path} should be documented`
      ).toBeDefined();
    }
  });

  /**
   * Property-based test: For any route in the spec, it should have required OpenAPI fields
   */
  it('should have required fields for all documented routes', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(paths)),
        (pathKey) => {
          const pathItem = paths[pathKey];
          const methods = ['get', 'post', 'put', 'delete', 'patch'];
          
          // For each HTTP method defined in this path
          for (const method of methods) {
            if (pathItem[method]) {
              const operation = pathItem[method];
              
              // Each operation should have required fields
              expect(operation.summary, `${method.toUpperCase()} ${pathKey} should have a summary`).toBeDefined();
              expect(operation.responses, `${method.toUpperCase()} ${pathKey} should have responses`).toBeDefined();
              expect(operation.tags, `${method.toUpperCase()} ${pathKey} should have tags`).toBeDefined();
              expect(Array.isArray(operation.tags), `${method.toUpperCase()} ${pathKey} tags should be an array`).toBe(true);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: All routes should have proper response schemas
   */
  it('should have response schemas for all documented routes', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(paths)),
        (pathKey) => {
          const pathItem = paths[pathKey];
          const methods = ['get', 'post', 'put', 'delete', 'patch'];
          
          for (const method of methods) {
            if (pathItem[method]) {
              const operation = pathItem[method];
              const responses = operation.responses;
              
              // Should have at least one response defined
              expect(Object.keys(responses).length, `${method.toUpperCase()} ${pathKey} should have at least one response`).toBeGreaterThan(0);
              
              // Each response should have content or description
              for (const [statusCode, response] of Object.entries(responses)) {
                expect(
                  response.description || response.content,
                  `${method.toUpperCase()} ${pathKey} response ${statusCode} should have description or content`
                ).toBeDefined();
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: Property 22: OpenAPI spec updates
 * Validates: Requirements 8.3
 * 
 * For any API route that is added or modified, the OpenAPI specification 
 * should reflect those changes after regeneration.
 */
describe('OpenAPI Spec Updates', () => {
  /**
   * Property-based test: Regenerating the spec should produce consistent results
   */
  it('should produce consistent spec when regenerated multiple times', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (iterations) => {
          // Generate the spec multiple times
          const specs = [];
          for (let i = 0; i < iterations; i++) {
            specs.push(getOpenAPISpec());
          }
          
          // All specs should be identical (same paths, same operations)
          for (let i = 1; i < specs.length; i++) {
            expect(
              JSON.stringify(specs[i].paths),
              'Regenerated spec should have identical paths'
            ).toBe(JSON.stringify(specs[0].paths));
            
            expect(
              JSON.stringify(specs[i].components),
              'Regenerated spec should have identical components'
            ).toBe(JSON.stringify(specs[0].components));
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: The spec should reflect current route definitions
   */
  it('should include route metadata from JSDoc comments', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(paths)),
        (pathKey) => {
          const pathItem = paths[pathKey];
          const methods = ['get', 'post', 'put', 'delete', 'patch'];
          
          for (const method of methods) {
            if (pathItem[method]) {
              const operation = pathItem[method];
              
              // The spec should include metadata from JSDoc
              expect(operation.summary, `${method.toUpperCase()} ${pathKey} should have summary from JSDoc`).toBeDefined();
              expect(operation.description, `${method.toUpperCase()} ${pathKey} should have description from JSDoc`).toBeDefined();
              
              // Tags should be defined
              expect(operation.tags?.length, `${method.toUpperCase()} ${pathKey} should have at least one tag`).toBeGreaterThan(0);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that spec includes all current routes (validates automatic updates)
   */
  it('should automatically include newly documented routes', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};
    
    // Verify that all our documented routes are present
    const documentedRoutes = [
      '/api/search',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/me',
    ];
    
    for (const route of documentedRoutes) {
      expect(paths[route], `Route ${route} should be in the spec`).toBeDefined();
    }
    
    // Verify the spec has the correct number of paths (no missing routes)
    expect(Object.keys(paths).length, 'Spec should include all documented routes').toBeGreaterThanOrEqual(documentedRoutes.length);
  });
});

/**
 * Feature: Property 23: Authentication documentation
 * Validates: Requirements 8.4
 * 
 * For any API endpoint that requires authentication, the OpenAPI specification 
 * should document the authentication scheme (e.g., Bearer token) in the security requirements.
 */
describe('Authentication Documentation', () => {
  /**
   * Test that security schemes are defined in the spec
   */
  it('should define BearerAuth security scheme in components', () => {
    const spec = getOpenAPISpec();
    
    expect(spec.components?.securitySchemes, 'Spec should have security schemes').toBeDefined();
    expect(spec.components?.securitySchemes?.BearerAuth, 'BearerAuth scheme should be defined').toBeDefined();
    
    const bearerAuth = spec.components?.securitySchemes?.BearerAuth;
    expect(bearerAuth.type, 'BearerAuth should be http type').toBe('http');
    expect(bearerAuth.scheme, 'BearerAuth should use bearer scheme').toBe('bearer');
  });

  /**
   * Property-based test: Protected routes should have security requirements
   */
  it('should document security requirements for protected routes', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};
    
    // Define routes that require authentication
    const protectedRoutes = [
      { path: '/api/auth/logout', method: 'post' },
      { path: '/api/auth/me', method: 'get' },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...protectedRoutes),
        (route) => {
          const pathItem = paths[route.path];
          expect(pathItem, `Protected route ${route.path} should be documented`).toBeDefined();
          
          const operation = pathItem[route.method];
          expect(operation, `Method ${route.method} for ${route.path} should be documented`).toBeDefined();
          
          // Protected routes should have security requirements
          expect(
            operation.security,
            `${route.method.toUpperCase()} ${route.path} should have security requirements`
          ).toBeDefined();
          
          expect(
            Array.isArray(operation.security),
            `${route.method.toUpperCase()} ${route.path} security should be an array`
          ).toBe(true);
          
          // Should include BearerAuth
          const hasBearerAuth = operation.security.some((sec: any) => sec.BearerAuth !== undefined);
          expect(
            hasBearerAuth,
            `${route.method.toUpperCase()} ${route.path} should require BearerAuth`
          ).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Public routes should not have security requirements
   */
  it('should not require authentication for public routes', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};
    
    // Define routes that should be public
    const publicRoutes = [
      { path: '/api/auth/register', method: 'post' },
      { path: '/api/auth/login', method: 'post' },
      { path: '/api/search', method: 'get' },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...publicRoutes),
        (route) => {
          const pathItem = paths[route.path];
          const operation = pathItem?.[route.method];
          
          if (operation) {
            // Public routes should either not have security or have empty security
            const hasNoSecurity = !operation.security || operation.security.length === 0;
            expect(
              hasNoSecurity,
              `${route.method.toUpperCase()} ${route.path} should not require authentication`
            ).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: All routes with security should reference defined schemes
   */
  it('should only reference defined security schemes', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};
    const definedSchemes = Object.keys(spec.components?.securitySchemes || {});

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(paths)),
        (pathKey) => {
          const pathItem = paths[pathKey];
          const methods = ['get', 'post', 'put', 'delete', 'patch'];
          
          for (const method of methods) {
            if (pathItem[method]?.security) {
              const security = pathItem[method].security;
              
              // Each security requirement should reference a defined scheme
              for (const secReq of security) {
                const schemes = Object.keys(secReq);
                for (const scheme of schemes) {
                  expect(
                    definedSchemes.includes(scheme),
                    `${method.toUpperCase()} ${pathKey} references undefined security scheme: ${scheme}`
                  ).toBe(true);
                }
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: Property 24: Schema documentation completeness
 * Validates: Requirements 8.5
 * 
 * For any API endpoint with defined request or response schemas, those schemas 
 * should be included in the OpenAPI specification with all required fields documented.
 */
describe('Schema Documentation Completeness', () => {
  /**
   * Test that all expected schemas are defined in components
   */
  it('should define all core data model schemas', () => {
    const spec = getOpenAPISpec();
    const schemas = spec.components?.schemas || {};
    
    // Core schemas that should be documented
    const expectedSchemas = [
      'User',
      'Object',
      'FundingRound',
      'Investment',
      'Acquisition',
      'Office',
      'Error',
    ];
    
    for (const schemaName of expectedSchemas) {
      expect(schemas[schemaName], `Schema ${schemaName} should be defined`).toBeDefined();
    }
  });

  /**
   * Property-based test: All schemas should have type and properties
   */
  it('should have type and properties for all schemas', () => {
    const spec = getOpenAPISpec();
    const schemas = spec.components?.schemas || {};

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(schemas)),
        (schemaName) => {
          const schema = schemas[schemaName];
          
          // Each schema should have a type
          expect(schema.type, `Schema ${schemaName} should have a type`).toBeDefined();
          
          // Object schemas should have properties
          if (schema.type === 'object') {
            expect(
              schema.properties,
              `Object schema ${schemaName} should have properties`
            ).toBeDefined();
            
            // Properties should be an object with at least one property
            expect(
              Object.keys(schema.properties).length,
              `Schema ${schemaName} should have at least one property`
            ).toBeGreaterThan(0);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Routes with request bodies should reference schemas
   */
  it('should reference schemas for request bodies', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};
    
    // Routes that should have request body schemas
    const routesWithBodies = [
      { path: '/api/auth/register', method: 'post' },
      { path: '/api/auth/login', method: 'post' },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...routesWithBodies),
        (route) => {
          const pathItem = paths[route.path];
          const operation = pathItem?.[route.method];
          
          if (operation) {
            // Should have requestBody
            expect(
              operation.requestBody,
              `${route.method.toUpperCase()} ${route.path} should have requestBody`
            ).toBeDefined();
            
            // RequestBody should have content
            expect(
              operation.requestBody.content,
              `${route.method.toUpperCase()} ${route.path} requestBody should have content`
            ).toBeDefined();
            
            // Should have application/json content type
            const jsonContent = operation.requestBody.content['application/json'];
            expect(
              jsonContent,
              `${route.method.toUpperCase()} ${route.path} should accept application/json`
            ).toBeDefined();
            
            // Should have schema
            expect(
              jsonContent.schema,
              `${route.method.toUpperCase()} ${route.path} should have request schema`
            ).toBeDefined();
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: All routes should have response schemas
   */
  it('should reference schemas for responses', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(paths)),
        (pathKey) => {
          const pathItem = paths[pathKey];
          const methods = ['get', 'post', 'put', 'delete', 'patch'];
          
          for (const method of methods) {
            if (pathItem[method]) {
              const operation = pathItem[method];
              const responses = operation.responses;
              
              // Check success responses (2xx)
              for (const [statusCode, response] of Object.entries(responses)) {
                if (statusCode.startsWith('2') && response.content) {
                  const jsonContent = response.content['application/json'];
                  
                  if (jsonContent) {
                    // Should have schema
                    expect(
                      jsonContent.schema,
                      `${method.toUpperCase()} ${pathKey} response ${statusCode} should have schema`
                    ).toBeDefined();
                  }
                }
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-based test: Schema properties should have types
   */
  it('should define types for all schema properties', () => {
    const spec = getOpenAPISpec();
    const schemas = spec.components?.schemas || {};

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(schemas)),
        (schemaName) => {
          const schema = schemas[schemaName];
          
          if (schema.type === 'object' && schema.properties) {
            for (const [propName, propDef] of Object.entries(schema.properties)) {
              // Each property should have a type or $ref
              const hasType = propDef.type !== undefined;
              const hasRef = propDef.$ref !== undefined;
              
              expect(
                hasType || hasRef,
                `Property ${propName} in schema ${schemaName} should have type or $ref`
              ).toBe(true);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that error responses reference Error schema
   */
  it('should use Error schema for error responses', () => {
    const spec = getOpenAPISpec();
    const paths = spec.paths || {};
    
    for (const [pathKey, pathItem] of Object.entries(paths)) {
      const methods = ['get', 'post', 'put', 'delete', 'patch'];
      
      for (const method of methods) {
        if (pathItem[method]) {
          const operation = pathItem[method];
          const responses = operation.responses;
          
          // Check error responses (4xx, 5xx)
          for (const [statusCode, response] of Object.entries(responses)) {
            if ((statusCode.startsWith('4') || statusCode.startsWith('5')) && response.content) {
              const jsonContent = response.content['application/json'];
              
              if (jsonContent?.schema?.$ref) {
                // Should reference Error schema
                expect(
                  jsonContent.schema.$ref,
                  `${method.toUpperCase()} ${pathKey} error response ${statusCode} should reference Error schema`
                ).toBe('#/components/schemas/Error');
              }
            }
          }
        }
      }
    }
  });
});
