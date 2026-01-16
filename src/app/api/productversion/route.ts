
// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma/client'
// import { verifyAccessToken } from '@/lib/jwt'
// import { getAuthTokenFromCookies } from '@/lib/cookies'

// interface ProductVersion {
//   versionId: number
//   productId: number
//   versionNumber: string
//   releaseDate: Date
//   isActive: boolean
//   createdAt: Date
//   createdBy: number
//   updatedAt: Date
//   updatedBy: number
//   deletedAt: Date | null
//   deletedBy: number | null
// }

// // Helper function to extract employee ID from token
// function getEmployeeIdFromToken(accessToken: string): number {
//   try {
//     const payload = verifyAccessToken(accessToken);
//     return payload.userId || 1;
//   } catch (error) {
//     console.error('Error extracting employee ID from token:', error);
//     return 1;
//   }
// }

// // GET - Retrieve product versions with pagination, sorting, search, and filtering
// export async function GET(request: NextRequest) {
//   console.log(' Product Version GET request started');
  
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       console.log(' No access token found');
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     try {
//       verifyAccessToken(accessToken)
//       console.log(' Access token verified');
//     } catch (error) {
//       console.log(' Invalid access token:', error);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     const { searchParams } = new URL(request.url)

//     // Parse query parameters
//     const page = parseInt(searchParams.get('page') || '1')
//     const limit = parseInt(searchParams.get('limit') || '100')
//     const sortBy = searchParams.get('sortBy') || 'versionNumber'
//     const sortOrder = searchParams.get('sortOrder') || 'asc'
//     const search = searchParams.get('search') || ''
//     const productId = searchParams.get('productId')
//     const isActive = searchParams.get('isActive')

//     console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, productId, isActive });

//     // Calculate offset for pagination
//     const offset = (page - 1) * limit

//     // Build where clause
//     const where: any = {
//       deletedAt: null // Only get non-deleted product versions
//     }

//     // Apply search filter
//     if (search) {
//       where.versionNumber = { contains: search, mode: 'insensitive' }
//     }

//     // Apply filters
//     if (productId) {
//       where.productId = parseInt(productId)
//     }

//     if (isActive !== null && isActive !== undefined && isActive !== '') {
//       where.isActive = isActive === 'true'
//     }

//     // Build orderBy
//     const orderBy: any = {}
//     const validSortColumns = ['versionNumber', 'versionId', 'productId', 'releaseDate', 'isActive', 'createdAt']
//     const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'versionNumber'
//     orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

//     console.log(' Where clause:', JSON.stringify(where, null, 2));
//     console.log(' Order by:', orderBy);

//     try {
//       console.log('🔌 Testing database connection...');
//       await prisma.$connect();
//       console.log(' Database connected successfully');

//       // Get total count for pagination
//       console.log(' Getting total count...');
//       const totalCount = await prisma.productversion.count({ where });
//       console.log(` Total count: ${totalCount}`);

//       // Get product versions with pagination
//       console.log(' Fetching product versions...');
//       const productVersions: ProductVersion[] = await prisma.productversion.findMany({
//         where,
//         orderBy,
//         skip: offset,
//         take: limit,
//         select: {
//           versionId: true,
//           productId: true,
//           versionNumber: true,
//           releaseDate: true,
//           isActive: true,
//           createdAt: true,
//           createdBy: true,
//           updatedAt: true,
//           updatedBy: true,
//           deletedAt: true,
//           deletedBy: true,
//         }
//       }) as ProductVersion[];

//       console.log(` Found ${productVersions.length} product versions`);

//       // Transform data to match response format
//       const transformedProductVersions = productVersions.map((version: any) => ({
//         versionId: version.versionId,
//         productId: version.productId,
//         versionNumber: version.versionNumber,
//         releaseDate: version.releaseDate,
//         isActive: version.isActive,
//         createdAt: version.createdAt,
//         createdBy: version.createdBy || 1,
//         updatedAt: version.updatedAt,
//         updatedBy: version.updatedBy,
//         deletedAt: version.deletedAt,
//         deletedBy: version.deletedBy
//       }));

//       console.log(' Product versions transformed successfully');

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'Product versions retrieved successfully',
//           timestamp: new Date().toISOString(),
//           data: {
//             items: transformedProductVersions,
//             pagination: {
//               totalItems: totalCount,
//               page,
//               limit,
//               totalPages: Math.ceil(totalCount / limit)
//             }
//           }
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error(' Database error:', dbError);
//       console.error(' Error details:', {
//         name: dbError instanceof Error ? dbError.name : 'Unknown',
//         message: dbError instanceof Error ? dbError.message : 'Unknown error',
//         stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
//       });
      
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to retrieve product versions - Database error',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error(' Product versions GET error:', error);
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     )
//   } finally {
//     await prisma.$disconnect();
//   }
// }



// // POST - Create new product version
// export async function POST(request: NextRequest) {
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     let employeeId: number;
//     try {
//       verifyAccessToken(accessToken)
//       employeeId = getEmployeeIdFromToken(accessToken)
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     const body = await request.json()
    
//     // Validate required fields
//     const { productId, versionNumber, releaseDate, isActive } = body
    
//     console.log(' Received data:', { productId, versionNumber, releaseDate, isActive });
//     console.log(' Employee ID from token:', employeeId);

//     if (!productId || !versionNumber || !releaseDate) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Product ID, version number, and release date are required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Check if version number already exists for this product (only non-deleted)
//       const existingVersion = await prisma.productversion.findFirst({
//         where: {
//           productId: parseInt(productId),
//           versionNumber,
//           deletedAt: null
//         }
//       })

//       if (existingVersion) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 409,
//             message: 'Version number already exists for this product',
//             timestamp: new Date().toISOString()
//           },
//           { status: 409 }
//         )
//       }

//       // Check if product exists
//       const existingProduct = await prisma.product.findFirst({
//         where: {
//           productId: parseInt(productId),
//           deletedAt: null
//         }
//       })

//       if (!existingProduct) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 400,
//             message: 'Invalid product ID',
//             timestamp: new Date().toISOString()
//           },
//           { status: 400 }
//         )
//       }

//       // Create new product version
//       const version = await prisma.productversion.create({
//         data: {
//           productId: parseInt(productId),
//           versionNumber,
//           releaseDate: new Date(releaseDate),
//           isActive: isActive !== undefined ? isActive : true,
//           createdBy: employeeId,
//           updatedBy: employeeId
//         },
//         select: {
//           versionId: true,
//           productId: true,
//           versionNumber: true,
//           releaseDate: true,
//           isActive: true,
//           createdAt: true,
//           createdBy: true,
//           updatedAt: true,
//           updatedBy: true,
//           deletedAt: true,
//           deletedBy: true,
//         }
//       })

//       console.log(' Product version created:', version);

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 201,
//           message: 'Product version created successfully',
//           timestamp: new Date().toISOString(),
//           data: version
//         },
//         { status: 201 }
//       )

//     } catch (dbError) {
//       console.error(' Database error:', dbError)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to create product version',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error(' Product versions POST error:', error)
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     )
//   }
// }


// // PUT - Update product version
// export async function PUT(request: NextRequest) {
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     let employeeId: number;
//     try {
//       verifyAccessToken(accessToken)
//       employeeId = getEmployeeIdFromToken(accessToken)
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     const body = await request.json()
//     const { versionId, ...updateData } = body

//     console.log(' Update - Employee ID from token:', employeeId);
    
//     if (!versionId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Version ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Check if version exists and is not deleted
//       const existingVersion = await prisma.productversion.findFirst({
//         where: {
//           versionId: parseInt(versionId),
//           deletedAt: null
//         }
//       })

//       if (!existingVersion) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'Product version not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Check if version number already exists for the product (excluding current version and deleted ones)
//       if (updateData.versionNumber && updateData.productId) {
//         const duplicateVersion = await prisma.productversion.findFirst({
//           where: {
//             productId: parseInt(updateData.productId),
//             versionNumber: updateData.versionNumber,
//             versionId: { not: parseInt(versionId) },
//             deletedAt: null
//           }
//         })

//         if (duplicateVersion) {
//           return NextResponse.json(
//             { 
//               status: 'error',
//               code: 409,
//               message: 'Version number already exists for this product',
//               timestamp: new Date().toISOString()
//             },
//             { status: 409 }
//           )
//         }
//       }

//       // If productId is being updated, check if it exists
//       if (updateData.productId) {
//         const existingProduct = await prisma.product.findFirst({
//           where: {
//             productId: parseInt(updateData.productId),
//             deletedAt: null
//           }
//         })

//         if (!existingProduct) {
//           return NextResponse.json(
//             { 
//               status: 'error',
//               code: 400,
//               message: 'Invalid product ID',
//               timestamp: new Date().toISOString()
//             },
//             { status: 400 }
//           )
//         }
//       }

//       // Prepare update data
//       const prismaUpdateData: any = {
//         updatedBy: employeeId
//       }

//       if (updateData.productId !== undefined) prismaUpdateData.productId = parseInt(updateData.productId)
//       if (updateData.versionNumber !== undefined) prismaUpdateData.versionNumber = updateData.versionNumber
//       if (updateData.releaseDate !== undefined) prismaUpdateData.releaseDate = new Date(updateData.releaseDate)
//       if (updateData.isActive !== undefined) prismaUpdateData.isActive = updateData.isActive

//       console.log(' Update data:', prismaUpdateData);

//       // Update product version
//       const version = await prisma.productversion.update({
//         where: {
//           versionId: parseInt(versionId)
//         },
//         data: prismaUpdateData,
//         select: {
//           versionId: true,
//           productId: true,
//           versionNumber: true,
//           releaseDate: true,
//           isActive: true,
//           createdAt: true,
//           createdBy: true,
//           updatedAt: true,
//           updatedBy: true,
//           deletedAt: true,
//           deletedBy: true,
//         }
//       })

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'Product version updated successfully',
//           timestamp: new Date().toISOString(),
//           data: version
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error(' Database error:', dbError)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to update product version',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error(' Product versions PUT error:', error)
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     )
//   }
// }


// // DELETE - Delete product version (soft delete)
// export async function DELETE(request: NextRequest) {
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     let employeeId: number;
//     try {
//       verifyAccessToken(accessToken)
//       employeeId = getEmployeeIdFromToken(accessToken)
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     const { searchParams } = new URL(request.url)
//     const versionId = searchParams.get('versionId') || searchParams.get('id')

//     if (!versionId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Version ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Check if version exists and is not already deleted
//       const existingVersion = await prisma.productversion.findFirst({
//         where: {
//           versionId: parseInt(versionId),
//           deletedAt: null
//         }
//       })

//       if (!existingVersion) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'Product version not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Check if version is being used by any product variations
//       const variationsUsingVersion = await prisma.productvariation.findFirst({
//         where: {
//           versionId: parseInt(versionId),
//           deletedAt: null
//         }
//       })

//       if (variationsUsingVersion) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 400,
//             message: 'Cannot delete product version that is being used by product variations',
//             timestamp: new Date().toISOString()
//           },
//           { status: 400 }
//         )
//       }

//       // Soft delete the product version
//       await prisma.productversion.update({
//         where: {
//           versionId: parseInt(versionId)
//         },
//         data: {
//           deletedAt: new Date(),
//           deletedBy: employeeId,
//           isActive: false
//         }
//       })

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'Product version deleted successfully',
//           timestamp: new Date().toISOString()
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error(' Database error:', dbError)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to delete product version',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error(' Product versions DELETE error:', error)
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     )
//   }
// }








import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedSession } from '@/lib/api-auth-optimized'

interface ProductVersion {
  versionId: number
  productId: number
  versionNumber: string
  releaseDate: Date
  isActive: boolean
  createdAt: Date
  createdBy: number
  updatedAt: Date
  updatedBy: number
  deletedAt: Date | null
  deletedBy: number | null
}

// Helper function to extract employee ID from Supabase session


// GET - Retrieve product versions with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Product Version GET request started');
  
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

    console.log(' Session verified');

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const sortBy = searchParams.get('sortBy') || 'versionNumber'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const productId = searchParams.get('productId')
    const isActive = searchParams.get('isActive')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, productId, isActive });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only get non-deleted product versions
    }

    // Apply search filter
    if (search) {
      where.versionNumber = { contains: search, mode: 'insensitive' }
    }

    // Apply filters
    if (productId) {
      where.productId = parseInt(productId)
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['versionNumber', 'versionId', 'productId', 'releaseDate', 'isActive', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'versionNumber'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {
      // console.log('🔌 Testing database connection...');
      // await prisma.$connect();
      // console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.productversion.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get product versions with pagination
      console.log(' Fetching product versions...');
      const productVersions: ProductVersion[] = await prisma.productversion.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          versionId: true,
          productId: true,
          versionNumber: true,
          releaseDate: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      }) as ProductVersion[];

      console.log(` Found ${productVersions.length} product versions`);

      // Transform data to match response format
      const transformedProductVersions = productVersions.map((version: any) => ({
        versionId: version.versionId,
        productId: version.productId,
        versionNumber: version.versionNumber,
        releaseDate: version.releaseDate,
        isActive: version.isActive,
        createdAt: version.createdAt,
        createdBy: version.createdBy || 1,
        updatedAt: version.updatedAt,
        updatedBy: version.updatedBy,
        deletedAt: version.deletedAt,
        deletedBy: version.deletedBy
      }));

      console.log(' Product versions transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Product versions retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedProductVersions,
            pagination: {
              totalItems: totalCount,
              page,
              limit,
              totalPages: Math.ceil(totalCount / limit)
            }
          }
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError);
      console.error(' Error details:', {
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      });
      
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve product versions - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Product versions GET error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } 
}

// POST - Create new product version
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

const employeeId = authResult.employeeId

    const body = await request.json()
    
    // Validate required fields
    const { productId, versionNumber, releaseDate, isActive } = body
    
    console.log(' Received data:', { productId, versionNumber, releaseDate, isActive });
    console.log(' Employee ID from session:', employeeId);

    if (!productId || !versionNumber || !releaseDate) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Product ID, version number, and release date are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if version number already exists for this product (only non-deleted)
      const existingVersion = await prisma.productversion.findFirst({
        where: {
          productId: parseInt(productId),
          versionNumber,
          deletedAt: null
        }
      })

      if (existingVersion) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'Version number already exists for this product',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }

      // Check if product exists
      const existingProduct = await prisma.product.findFirst({
        where: {
          productId: parseInt(productId),
          deletedAt: null
        }
      })

      if (!existingProduct) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid product ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Create new product version
      const version = await prisma.productversion.create({
        data: {
          productId: parseInt(productId),
          versionNumber,
          releaseDate: new Date(releaseDate),
          isActive: isActive !== undefined ? isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        },
        select: {
          versionId: true,
          productId: true,
          versionNumber: true,
          releaseDate: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      console.log(' Product version created:', version);

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'Product version created successfully',
          timestamp: new Date().toISOString(),
          data: version
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create product version',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Product versions POST error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT - Update product version
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

const employeeId = authResult.employeeId

    const body = await request.json()
    const { versionId, ...updateData } = body

    console.log(' Update - Employee ID from session:', employeeId);
    
    if (!versionId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Version ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if version exists and is not deleted
      const existingVersion = await prisma.productversion.findFirst({
        where: {
          versionId: parseInt(versionId),
          deletedAt: null
        }
      })

      if (!existingVersion) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Product version not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if version number already exists for the product (excluding current version and deleted ones)
      if (updateData.versionNumber && updateData.productId) {
        const duplicateVersion = await prisma.productversion.findFirst({
          where: {
            productId: parseInt(updateData.productId),
            versionNumber: updateData.versionNumber,
            versionId: { not: parseInt(versionId) },
            deletedAt: null
          }
        })

        if (duplicateVersion) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'Version number already exists for this product',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // If productId is being updated, check if it exists
      if (updateData.productId) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            productId: parseInt(updateData.productId),
            deletedAt: null
          }
        })

        if (!existingProduct) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Invalid product ID',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
      }

      // Prepare update data
      const prismaUpdateData: any = {
        updatedBy: employeeId
      }

      if (updateData.productId !== undefined) prismaUpdateData.productId = parseInt(updateData.productId)
      if (updateData.versionNumber !== undefined) prismaUpdateData.versionNumber = updateData.versionNumber
      if (updateData.releaseDate !== undefined) prismaUpdateData.releaseDate = new Date(updateData.releaseDate)
      if (updateData.isActive !== undefined) prismaUpdateData.isActive = updateData.isActive

      console.log(' Update data:', prismaUpdateData);

      // Update product version
      const version = await prisma.productversion.update({
        where: {
          versionId: parseInt(versionId)
        },
        data: prismaUpdateData,
        select: {
          versionId: true,
          productId: true,
          versionNumber: true,
          releaseDate: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Product version updated successfully',
          timestamp: new Date().toISOString(),
          data: version
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update product version',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Product versions PUT error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete product version (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

const employeeId = authResult.employeeId

    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get('versionId') || searchParams.get('id')

    if (!versionId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Version ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if version exists and is not already deleted
      const existingVersion = await prisma.productversion.findFirst({
        where: {
          versionId: parseInt(versionId),
          deletedAt: null
        }
      })

      if (!existingVersion) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Product version not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if version is being used by any product variations
      const variationsUsingVersion = await prisma.productvariation.findFirst({
        where: {
          versionId: parseInt(versionId),
          deletedAt: null
        }
      })

      if (variationsUsingVersion) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Cannot delete product version that is being used by product variations',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Soft delete the product version
      await prisma.productversion.update({
        where: {
          versionId: parseInt(versionId)
        },
        data: {
          deletedAt: new Date(),
          deletedBy: employeeId,
          isActive: false
        }
      })

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Product version deleted successfully',
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete product version',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Product versions DELETE error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// ... existing swagger documentation ...







/**
 * @swagger
 * /api/productversion:
 *   get:
 *     tags:
 *       - Product Versions
 *     summary: Get all product versions
 *     description: Retrieve all product versions with pagination, sorting, search, and filtering
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: versionNumber
 *           enum: [versionNumber, versionId, productId, releaseDate, isActive, createdAt]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for version number
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Product versions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ProductVersion'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */




/**
 * @swagger
 * /api/productversion:
 *   post:
 *     tags:
 *       - Product Versions
 *     summary: Create a new product version
 *     description: Create a new product version in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - versionNumber
 *               - releaseDate
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: Product ID
 *                 example: 1
 *               versionNumber:
 *                 type: string
 *                 description: Version number (unique per product)
 *                 example: "v2.0"
 *               releaseDate:
 *                 type: string
 *                 format: date
 *                 description: Release date
 *                 example: "2023-12-01"
 *               isActive:
 *                 type: boolean
 *                 description: Active status
 *                 default: true
 *     responses:
 *       201:
 *         description: Product version created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProductVersion'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: Version number already exists for this product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */



/**
 * @swagger
 * /api/productversion:
 *   put:
 *     tags:
 *       - Product Versions
 *     summary: Update a product version
 *     description: Update an existing product version in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - type: object
 *                 required:
 *                   - versionId
 *                 properties:
 *                   versionId:
 *                     type: integer
 *                     description: Version ID to update
 *                     example: 1
 *               - type: object
 *                 properties:
 *                   productId:
 *                     type: integer
 *                     description: Product ID
 *                     example: 1
 *                   versionNumber:
 *                     type: string
 *                     description: Version number
 *                     example: "v2.1"
 *                   releaseDate:
 *                     type: string
 *                     format: date
 *                     description: Release date
 *                     example: "2023-12-15"
 *                   isActive:
 *                     type: boolean
 *                     description: Active status
 *     responses:
 *       200:
 *         description: Product version updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProductVersion'
 *       400:
 *         description: Bad request - Missing version ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Product version not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: Version number already exists for this product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */




/**
 * @swagger
 * /api/productversion:
 *   delete:
 *     tags:
 *       - Product Versions
 *     summary: Delete a product version
 *     description: Delete a product version from the system
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: versionId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Version ID to delete
 *         example: 1
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative version ID parameter
 *         example: 1
 *     responses:
 *       200:
 *         description: Product version deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - Missing version ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Product version not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */