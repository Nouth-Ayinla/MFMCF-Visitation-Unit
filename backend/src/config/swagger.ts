import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MFMCF Visitation Unit API',
    version: '1.0.0',
    description: 'API documentation for MFMCF Visitation Unit backend',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'JWT token stored in HTTP-only cookie',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          role: {
            type: 'string',
            enum: ['visitation_coordinator', 'assistant_coordinator', 'president', 'central', 'level_coordinator', 'admin', 'user'],
          },
          isApproved: { type: 'boolean' },
          approvedBy: { type: 'string' },
          approvedAt: { type: 'string', format: 'date-time' },
          departmentId: { type: 'string' },
          levelId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication endpoints',
    },
    {
      name: 'Members',
      description: 'Church member registration and management',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/presentation/routes/*.ts', './src/presentation/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
