import swaggerJsdoc from 'swagger-jsdoc';

/**
 * OpenAPI specification configuration
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Metior API',
      version: '1.0.0',
      description: 'API documentation for the Metior',
      contact: {
        name: 'API Support',
        email: 'support@metior.dev',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Session token obtained from login endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Object: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            entity_type: { type: 'string', enum: ['Company', 'FinancialOrg', 'Person'] },
            name: { type: 'string' },
            normalized_name: { type: 'string' },
            permalink: { type: 'string' },
            category_code: { type: 'string', nullable: true },
            status: { type: 'string', nullable: true },
            founded_at: { type: 'string', format: 'date', nullable: true },
            description: { type: 'string', nullable: true },
          },
        },
        FundingRound: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            round_code: { type: 'string', nullable: true },
            raised_amount: { type: 'number', nullable: true },
            raised_currency_code: { type: 'string', nullable: true },
            funded_at: { type: 'string', format: 'date', nullable: true },
            object_id: { type: 'string', format: 'uuid' },
          },
        },
        Investment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            funding_round_id: { type: 'string', format: 'uuid' },
            investor_object_id: { type: 'string', format: 'uuid' },
          },
        },
        Acquisition: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            price_amount: { type: 'number', nullable: true },
            price_currency_code: { type: 'string', nullable: true },
            acquired_at: { type: 'string', format: 'date', nullable: true },
            acquiring_object_id: { type: 'string', format: 'uuid' },
            acquired_object_id: { type: 'string', format: 'uuid' },
          },
        },
        Office: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            object_id: { type: 'string', format: 'uuid' },
            address1: { type: 'string', nullable: true },
            address2: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            state_code: { type: 'string', nullable: true },
            country_code: { type: 'string', nullable: true },
            zip_code: { type: 'string', nullable: true },
            latitude: { type: 'number', nullable: true },
            longitude: { type: 'number', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./app/api/**/*.ts'], // Path to API route files
};

/**
 * Generate OpenAPI specification
 */
export function generateOpenAPISpec() {
  return swaggerJsdoc(options);
}

/**
 * Get the OpenAPI specification as JSON
 */
export function getOpenAPISpec() {
  return generateOpenAPISpec();
}
