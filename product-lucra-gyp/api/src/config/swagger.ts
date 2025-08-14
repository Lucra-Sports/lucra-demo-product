import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "RNG API",
    version: "1.0.0",
    description:
      "A TypeScript API with Prisma ORM featuring user management, random number generation, and external service bindings",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Development server",
    },
    {
      url: "http://playrng-lucra-gyp.us-east-1.elasticbeanstalk.com",
      description: "Sandbox server",
    },
  ],
  components: {
    securitySchemes: {
      UserAuth: {
        type: "apiKey",
        in: "header",
        name: "rng-user-id",
        description:
          "User ID for authentication (obtained from login response)",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          fullName: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          address: { type: "string", nullable: true, example: "123 Main St" },
          city: { type: "string", nullable: true, example: "New York" },
          state: { type: "string", nullable: true, example: "NY" },
          zipCode: { type: "string", nullable: true, example: "10001" },
          birthday: {
            type: "string",
            format: "date",
            nullable: true,
            example: "1990-01-01",
          },
        },
      },
      UserBinding: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 1 },
          externalId: { type: "string", example: "oauth_12345" },
          type: { type: "string", example: "oauth_provider" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T10:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T10:00:00Z",
          },
        },
      },
      NumberRecord: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          value: { type: "integer", example: 7843 },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T10:00:00Z",
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Error message" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: { type: "string", example: "password123" },
        },
      },
      SignupRequest: {
        type: "object",
        required: ["fullName", "email", "password"],
        properties: {
          fullName: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: { type: "string", example: "password123" },
          address: { type: "string", example: "123 Main St" },
          city: { type: "string", example: "New York" },
          state: { type: "string", example: "NY" },
          zipCode: { type: "string", example: "10001" },
          birthday: { type: "string", format: "date", example: "1990-01-01" },
        },
      },
      CreateBindingRequest: {
        type: "object",
        required: ["externalId", "type"],
        properties: {
          externalId: { type: "string", example: "oauth_12345" },
          type: { type: "string", example: "oauth_provider" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        required: ["fullName", "email"],
        properties: {
          fullName: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          address: { type: "string", example: "123 Main St" },
          city: { type: "string", example: "New York" },
          state: { type: "string", example: "NY" },
          zipCode: { type: "string", example: "10001" },
          birthday: { type: "string", format: "date", example: "1990-01-01" },
        },
      },
      RngResponse: {
        type: "object",
        properties: {
          number: { type: "integer", example: 7843 },
          created_at: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T10:00:00Z",
          },
        },
      },
      StatsResponse: {
        type: "object",
        properties: {
          totalNumbersGenerated: { type: "integer", example: 42 },
          bestNumber: { type: "integer", example: 9876 },
        },
      },
      NumbersListResponse: {
        type: "object",
        properties: {
          numbers: {
            type: "array",
            items: { $ref: "#/components/schemas/NumberRecord" },
          },
          page: { type: "integer", example: 1 },
          totalPages: { type: "integer", example: 5 },
          next: {
            type: "string",
            nullable: true,
            example: "http://localhost:4000/numbers?limit=25&page=2",
          },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "healthy" },
          database: { type: "string", example: "connected" },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T10:00:00Z",
          },
        },
      },
    },
  },
};

// Determine if we're in development (TypeScript) or production (JavaScript)
const isDev = process.env.NODE_ENV !== 'production';
const srcDir = isDev ? path.join(__dirname, '../') : path.join(__dirname, '../');
const extension = isDev ? 'ts' : 'js';

const options = {
  definition: swaggerDefinition,
  apis: [
    path.join(srcDir, `controllers/*.${extension}`),
    path.join(srcDir, `server.${extension}`)
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
