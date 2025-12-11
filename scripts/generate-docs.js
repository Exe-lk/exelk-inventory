const fs = require('fs');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Exelk Inventory Management API',
      version: '1.0.0',
      description: 'API documentation for Exelk Inventory Management System',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/app/api/**/*.ts'],
};

const specs = swaggerJSDoc(options);
fs.writeFileSync('./public/swagger.json', JSON.stringify(specs, null, 2));
console.log('API documentation generated successfully!');