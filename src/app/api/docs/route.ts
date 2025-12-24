// import { NextResponse } from 'next/server';
// import { swaggerSpec } from '@/lib/swagger';

// export async function GET() {
//   return NextResponse.json(swaggerSpec);
// }


import { NextResponse } from 'next/server';
import swaggerJsdoc from 'swagger-jsdoc';

export async function GET() {
  try {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'My API',
          version: '1.0.0',
        },
      },
      apis: ['./src/app/api/**/*.ts'], // make sure this path exists
    };

    // generate Swagger spec at runtime
    const swaggerSpec = swaggerJsdoc(options);

    return NextResponse.json(swaggerSpec);
  } catch (err) {
    console.error('Failed to generate Swagger spec:', err);
    return NextResponse.json({}); // fallback empty object
  }
}
