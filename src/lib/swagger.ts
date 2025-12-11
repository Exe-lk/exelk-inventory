import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Exelk Inventory Management API',
      version: '1.0.0',
      description: 'API documentation for Exelk Inventory Management System',
      contact: {
        name: 'API Support',
        email: 'support@exelk.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken'
        }
      },
      schemas: {
        // Brand schemas
        Brand: {
          type: 'object',
          properties: {
            brandID: { type: 'integer', description: 'Brand ID' },
            brandName: { type: 'string', description: 'Brand name' },
            description: { type: 'string', description: 'Brand description' },
            country: { type: 'string', description: 'Country of origin' },
            isActive: { type: 'boolean', description: 'Active status' },
            createdAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'integer' },
            updatedAt: { type: 'string', format: 'date-time' },
            updatedBy: { type: 'integer' }
          }
        },
        CreateBrandRequest: {
          type: 'object',
          required: ['brandName'],
          properties: {
            brandName: { type: 'string', description: 'Brand name' },
            description: { type: 'string', description: 'Brand description' },
            country: { type: 'string', description: 'Country of origin' },
            isActive: { type: 'boolean', description: 'Active status', default: true }
          }
        },
        // Category schemas
        Category: {
          type: 'object',
          properties: {
            categoryID: { type: 'integer', description: 'Category ID' },
            categoryName: { type: 'string', description: 'Category name' },
            description: { type: 'string', description: 'Category description' },
            mainCategory: { type: 'string', enum: ['Laptop', 'Desktop', 'Accessories'] },
            isActive: { type: 'boolean', description: 'Active status' },
            createdAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'integer' },
            updatedAt: { type: 'string', format: 'date-time' },
            updatedBy: { type: 'integer' }
          }
        },
        CreateCategoryRequest: {
          type: 'object',
          required: ['categoryName', 'description'],
          properties: {
            categoryName: { type: 'string', description: 'Category name' },
            description: { type: 'string', description: 'Category description' },
            mainCategory: { 
              type: 'string', 
              enum: ['Laptop', 'Desktop', 'Accessories'],
              description: 'Main category'
            },
            isActive: { type: 'boolean', description: 'Active status', default: true }
          }
        },
        // Model schemas
        Model: {
          type: 'object',
          properties: {
            modelID: { type: 'integer', description: 'Model ID' },
            modelName: { type: 'string', description: 'Model name' },
            description: { type: 'string', description: 'Model description' },
            brandID: { type: 'integer', description: 'Brand ID' },
            isActive: { type: 'boolean', description: 'Active status' },
            createdAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'integer' },
            updatedAt: { type: 'string', format: 'date-time' },
            updatedBy: { type: 'integer' }
          }
        },
        CreateModelRequest: {
          type: 'object',
          required: ['modelName', 'brandID'],
          properties: {
            modelName: { type: 'string', description: 'Model name' },
            description: { type: 'string', description: 'Model description' },
            brandID: { type: 'integer', description: 'Brand ID' },
            isActive: { type: 'boolean', description: 'Active status', default: true }
          }
        },
        // Supplier schemas
        Supplier: {
          type: 'object',
          properties: {
            supplierID: { type: 'integer', description: 'Supplier ID' },
            supplierName: { type: 'string', description: 'Supplier name' },
            contactPerson: { type: 'string', description: 'Contact person' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            phone: { type: 'string', description: 'Phone number' },
            address: { type: 'string', description: 'Address' },
            city: { type: 'string', description: 'City' },
            country: { type: 'string', description: 'Country' },
            isActive: { type: 'boolean', description: 'Active status' },
            createdAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'integer' },
            updatedAt: { type: 'string', format: 'date-time' },
            updatedBy: { type: 'integer' }
          }
        },
        CreateSupplierRequest: {
          type: 'object',
          required: ['supplierName', 'contactPerson', 'email', 'phone'],
          properties: {
            supplierName: { type: 'string', description: 'Supplier name' },
            contactPerson: { type: 'string', description: 'Contact person' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            phone: { type: 'string', description: 'Phone number' },
            address: { type: 'string', description: 'Address' },
            city: { type: 'string', description: 'City' },
            country: { type: 'string', description: 'Country' },
            isActive: { type: 'boolean', description: 'Active status', default: true }
          }
        },
        // Employee schemas
        Employee: {
          type: 'object',
          properties: {
            employeeID: { type: 'integer', description: 'Employee ID' },
            userName: { type: 'string', description: 'Username' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            phone: { type: 'string', description: 'Phone number' },
            roleID: { type: 'integer', description: 'Role ID' },
            createdBy: { type: 'integer' },
            createdDate: { type: 'string', format: 'date-time' }
          }
        },
        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', description: 'Username' },
            password: { type: 'string', description: 'Password' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                userId: { type: 'integer' },
                username: { type: 'string' },
                role: { type: 'string' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' }
              }
            }
          }
        },
        // Common response schemas
        ApiResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'error'] },
            code: { type: 'integer' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success'] },
            code: { type: 'integer' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array', items: {} },
                pagination: {
                  type: 'object',
                  properties: {
                    totalItems: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        cookieAuth: []
      }
    ]
  },
  apis: ['./src/app/api/**/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJSDoc(options);