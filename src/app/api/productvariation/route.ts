
// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma/client'
// import { verifyAccessToken } from '@/lib/jwt'
// import { getAuthTokenFromCookies } from '@/lib/cookies'

// interface ProductVariation {
//   variationId: number
//   versionId: number
//   variationName: string
//   color: string | null
//   size: string | null
//   capacity: string | null
//   barcode: string | null
//   price: number
//   quantity: number
//   minStockLevel: number
//   maxStockLevel: number
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

// // GET - Retrieve product variations with pagination, sorting, search, and filtering
// export async function GET(request: NextRequest) {
//   console.log(' Product Variation GET request started');
  
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
//     const sortBy = searchParams.get('sortBy') || 'variationName'
//     const sortOrder = searchParams.get('sortOrder') || 'asc'
//     const search = searchParams.get('search') || ''
//     const versionId = searchParams.get('versionId')
//     const color = searchParams.get('color')
//     const size = searchParams.get('size')
//     const capacity = searchParams.get('capacity')
//     const isActive = searchParams.get('isActive')

//     console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, versionId, color, size, capacity, isActive });

//     // Calculate offset for pagination
//     const offset = (page - 1) * limit

//     // Build where clause
//     const where: any = {
//       deletedAt: null // Only get non-deleted product variations
//     }

//     // Apply search filter
//     if (search) {
//       where.OR = [
//         { variationName: { contains: search, mode: 'insensitive' } },
//         { barcode: { contains: search, mode: 'insensitive' } },
//         { color: { contains: search, mode: 'insensitive' } },
//         { size: { contains: search, mode: 'insensitive' } }
//       ]
//     }

//     // Apply filters
//     if (versionId) {
//       where.versionId = parseInt(versionId)
//     }

//     if (color) {
//       where.color = color
//     }

//     if (size) {
//       where.size = size
//     }

//     if (capacity) {
//       where.capacity = capacity
//     }

//     if (isActive !== null && isActive !== undefined && isActive !== '') {
//       where.isActive = isActive === 'true'
//     }

//     // Build orderBy
//     const orderBy: any = {}
//     const validSortColumns = ['variationName', 'variationId', 'versionId', 'color', 'size', 'capacity', 'price', 'quantity', 'isActive', 'createdAt']
//     const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'variationName'
//     orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

//     console.log(' Where clause:', JSON.stringify(where, null, 2));
//     console.log(' Order by:', orderBy);

//     try {
//       console.log(' Testing database connection...');
//       await prisma.$connect();
//       console.log(' Database connected successfully');

//       // Get total count for pagination
//       console.log(' Getting total count...');
//       const totalCount = await prisma.productvariation.count({ where });
//       console.log(` Total count: ${totalCount}`);

//       // Get product variations with pagination
//       console.log(' Fetching product variations...');
//       const productVariationsRaw = await prisma.productvariation.findMany({
//         where,
//         orderBy,
//         skip: offset,
//         take: limit,
//         select: {
//           variationId: true,
//           versionId: true,
//           variationName: true,
//           color: true,
//           size: true,
//           capacity: true,
//           barcode: true,
//           price: true,
//           quantity: true,
//           minStockLevel: true,
//           maxStockLevel: true,
//           isActive: true,
//           createdAt: true,
//           createdBy: true,
//           updatedAt: true,
//           updatedBy: true,
//           deletedAt: true,
//           deletedBy: true,
//         }
//       }) ;

//       console.log(` Found ${productVariationsRaw.length} product variations`);

//       // Transform data to match response format
//       const transformedProductVariations = productVariationsRaw.map((variation: any) => ({
//         variationId: variation.variationId,
//         versionId: variation.versionId,
//         variationName: variation.variationName,
//         color: variation.color,
//         size: variation.size,
//         capacity: variation.capacity,
//         barcode: variation.barcode,
//         price: variation.price,
//         quantity: variation.quantity,
//         minStockLevel: variation.minStockLevel,
//         maxStockLevel: variation.maxStockLevel,
//         isActive: variation.isActive,
//         createdAt: variation.createdAt,
//         createdBy: variation.createdBy || 1,
//         updatedAt: variation.updatedAt,
//         updatedBy: variation.updatedBy,
//         deletedAt: variation.deletedAt,
//         deletedBy: variation.deletedBy
//       }));

//       console.log(' Product variations transformed successfully');

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'Product variations retrieved successfully',
//           timestamp: new Date().toISOString(),
//           data: {
//             items: transformedProductVariations,
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
//           message: 'Failed to retrieve product variations - Database error',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error(' Product variations GET error:', error);
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



// // POST - Create new product variation
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
//     const { versionId, variationName, color, size, capacity, barcode, price, quantity, minStockLevel, maxStockLevel, isActive } = body
    
//     console.log(' Received data:', { versionId, variationName, color, size, capacity, barcode, price, quantity, minStockLevel, maxStockLevel, isActive });
//     console.log(' Employee ID from token:', employeeId);

//     if (!versionId || !variationName) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Version ID and variation name are required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Check if variation already exists for this version with same attributes (only non-deleted)
//       const existingVariation = await prisma.productvariation.findFirst({
//         where: {
//           versionId: parseInt(versionId),
//           variationName,
//           color: color || '',
//           size: size || '',
//           capacity: capacity || '',
//           deletedAt: null
//         }
//       })

//       if (existingVariation) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 409,
//             message: 'Product variation already exists',
//             timestamp: new Date().toISOString()
//           },
//           { status: 409 }
//         )
//       }

//       // Check if barcode already exists (if provided) (only non-deleted)
//       if (barcode) {
//         const existingBarcode = await prisma.productvariation.findFirst({
//           where: {
//             barcode,
//             deletedAt: null
//           }
//         })

//         if (existingBarcode) {
//           return NextResponse.json(
//             { 
//               status: 'error',
//               code: 409,
//               message: 'Barcode already exists',
//               timestamp: new Date().toISOString()
//             },
//             { status: 409 }
//           )
//         }
//       }

//       // Check if version exists
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
//             code: 400,
//             message: 'Invalid version ID',
//             timestamp: new Date().toISOString()
//           },
//           { status: 400 }
//         )
//       }

//       // Create new product variation
//       const variation = await prisma.productvariation.create({
//         data: {
//           versionId: parseInt(versionId),
//           variationName,
//           color: color || '',
//           size: size || '',
//           capacity: capacity || '',
//           barcode: barcode || '',
//           price: parseFloat(price?.toString() || '0') || 0,
//           quantity: parseInt(quantity?.toString() || '0') || 0,
//           minStockLevel: parseInt(minStockLevel?.toString() || '0') || 0,
//           maxStockLevel: parseInt(maxStockLevel?.toString() || '0') || 0,
//           isActive: isActive !== undefined ? isActive : true,
//           createdBy: employeeId,
//           updatedBy: employeeId
//         },
//         select: {
//           variationId: true,
//           versionId: true,
//           variationName: true,
//           color: true,
//           size: true,
//           capacity: true,
//           barcode: true,
//           price: true,
//           quantity: true,
//           minStockLevel: true,
//           maxStockLevel: true,
//           isActive: true,
//           createdAt: true,
//           createdBy: true,
//           updatedAt: true,
//           updatedBy: true,
//           deletedAt: true,
//           deletedBy: true,
//         }
//       })

//       console.log(' Product variation created:', variation);

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 201,
//           message: 'Product variation created successfully',
//           timestamp: new Date().toISOString(),
//           data: variation
//         },
//         { status: 201 }
//       )

//     } catch (dbError) {
//       console.error(' Database error:', dbError)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to create product variation',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error(' Product variations POST error:', error)
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


// // PUT - Update product variation
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
//     const { variationId, ...updateData } = body

//     console.log(' Update - Employee ID from token:', employeeId);
    
//     if (!variationId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Variation ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Check if variation exists and is not deleted
//       const existingVariation = await prisma.productvariation.findFirst({
//         where: {
//           variationId: parseInt(variationId),
//           deletedAt: null
//         }
//       })

//       if (!existingVariation) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'Product variation not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Check if barcode already exists (excluding current variation and deleted ones)
//       if (updateData.barcode) {
//         const duplicateBarcode = await prisma.productvariation.findFirst({
//           where: {
//             barcode: updateData.barcode,
//             variationId: { not: parseInt(variationId) },
//             deletedAt: null
//           }
//         })

//         if (duplicateBarcode) {
//           return NextResponse.json(
//             { 
//               status: 'error',
//               code: 409,
//               message: 'Barcode already exists',
//               timestamp: new Date().toISOString()
//             },
//             { status: 409 }
//           )
//         }
//       }

//       // If versionId is being updated, check if it exists
//       if (updateData.versionId) {
//         const existingVersion = await prisma.productversion.findFirst({
//           where: {
//             versionId: parseInt(updateData.versionId),
//             deletedAt: null
//           }
//         })

//         if (!existingVersion) {
//           return NextResponse.json(
//             { 
//               status: 'error',
//               code: 400,
//               message: 'Invalid version ID',
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

//       if (updateData.versionId !== undefined) prismaUpdateData.versionId = parseInt(updateData.versionId)
//       if (updateData.variationName !== undefined) prismaUpdateData.variationName = updateData.variationName
//       if (updateData.color !== undefined) prismaUpdateData.color = updateData.color
//       if (updateData.size !== undefined) prismaUpdateData.size = updateData.size
//       if (updateData.capacity !== undefined) prismaUpdateData.capacity = updateData.capacity
//       if (updateData.barcode !== undefined) prismaUpdateData.barcode = updateData.barcode
//       if (updateData.price !== undefined) prismaUpdateData.price = parseFloat(updateData.price?.toString() || '0')
//       if (updateData.quantity !== undefined) prismaUpdateData.quantity = parseInt(updateData.quantity?.toString() || '0')
//       if (updateData.minStockLevel !== undefined) prismaUpdateData.minStockLevel = parseInt(updateData.minStockLevel?.toString() || '0')
//       if (updateData.maxStockLevel !== undefined) prismaUpdateData.maxStockLevel = parseInt(updateData.maxStockLevel?.toString() || '0')
//       if (updateData.isActive !== undefined) prismaUpdateData.isActive = updateData.isActive

//       console.log(' Update data:', prismaUpdateData);

//       // Update product variation
//       const variation = await prisma.productvariation.update({
//         where: {
//           variationId: parseInt(variationId)
//         },
//         data: prismaUpdateData,
//         select: {
//           variationId: true,
//           versionId: true,
//           variationName: true,
//           color: true,
//           size: true,
//           capacity: true,
//           barcode: true,
//           price: true,
//           quantity: true,
//           minStockLevel: true,
//           maxStockLevel: true,
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
//           message: 'Product variation updated successfully',
//           timestamp: new Date().toISOString(),
//           data: variation
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error(' Database error:', dbError)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to update product variation',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error(' Product variations PUT error:', error)
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


// // DELETE - Delete product variation (soft delete)
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
//     const variationId = searchParams.get('variationId') || searchParams.get('id')

//     if (!variationId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Variation ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Check if variation exists and is not already deleted
//       const existingVariation = await prisma.productvariation.findFirst({
//         where: {
//           variationId: parseInt(variationId),
//           deletedAt: null
//         }
//       })

//       if (!existingVariation) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'Product variation not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Check if variation is being used by any spec details
//       const specDetailsUsingVariation = await prisma.specdetails.findFirst({
//         where: {
//           variationId: parseInt(variationId),
//           deletedAt: null
//         }
//       })

//       if (specDetailsUsingVariation) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 400,
//             message: 'Cannot delete product variation that is being used by spec details',
//             timestamp: new Date().toISOString()
//           },
//           { status: 400 }
//         )
//       }

//       // Soft delete the product variation
//       await prisma.productvariation.update({
//         where: {
//           variationId: parseInt(variationId)
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
//           message: 'Product variation deleted successfully',
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
//           message: 'Failed to delete product variation',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error(' Product variations DELETE error:', error)
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

interface ProductVariation {
  variationId: number
  versionId: number
  variationName: string
  color: string | null
  size: string | null
  capacity: string | null
  barcode: string | null
  price: number
  quantity: number
  minStockLevel: number
  maxStockLevel: number
  isActive: boolean
  createdAt: Date
  createdBy: number
  updatedAt: Date
  updatedBy: number
  deletedAt: Date | null
  deletedBy: number | null
}

// Helper function to extract employee ID from Supabase session
async function getEmployeeIdFromSession(request: NextRequest): Promise<number | null> {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }
    
    const employeeId = session.user.user_metadata?.employee_id
    return employeeId ? parseInt(employeeId.toString()) : null
  } catch (error) {
    console.error('Error extracting employee ID from session:', error)
    return null
  }
}

// GET - Retrieve product variations with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Product Variation GET request started');
  
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log(' No valid session found');
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    console.log(' Session verified');

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const sortBy = searchParams.get('sortBy') || 'variationName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const versionId = searchParams.get('versionId')
    const color = searchParams.get('color')
    const size = searchParams.get('size')
    const capacity = searchParams.get('capacity')
    const isActive = searchParams.get('isActive')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, versionId, color, size, capacity, isActive });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only get non-deleted product variations
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { variationName: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Apply filters
    if (versionId) {
      where.versionId = parseInt(versionId)
    }

    if (color) {
      where.color = color
    }

    if (size) {
      where.size = size
    }

    if (capacity) {
      where.capacity = capacity
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['variationName', 'variationId', 'versionId', 'color', 'size', 'capacity', 'price', 'quantity', 'isActive', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'variationName'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {
      console.log(' Testing database connection...');
      await prisma.$connect();
      console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.productvariation.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get product variations with pagination
      console.log(' Fetching product variations...');
      const productVariationsRaw = await prisma.productvariation.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          variationId: true,
          versionId: true,
          variationName: true,
          color: true,
          size: true,
          capacity: true,
          barcode: true,
          price: true,
          quantity: true,
          minStockLevel: true,
          maxStockLevel: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      }) ;

      console.log(` Found ${productVariationsRaw.length} product variations`);

      // Transform data to match response format
      const transformedProductVariations = productVariationsRaw.map((variation: any) => ({
        variationId: variation.variationId,
        versionId: variation.versionId,
        variationName: variation.variationName,
        color: variation.color,
        size: variation.size,
        capacity: variation.capacity,
        barcode: variation.barcode,
        price: variation.price,
        quantity: variation.quantity,
        minStockLevel: variation.minStockLevel,
        maxStockLevel: variation.maxStockLevel,
        isActive: variation.isActive,
        createdAt: variation.createdAt,
        createdBy: variation.createdBy || 1,
        updatedAt: variation.updatedAt,
        updatedBy: variation.updatedBy,
        deletedAt: variation.deletedAt,
        deletedBy: variation.deletedBy
      }));

      console.log(' Product variations transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Product variations retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedProductVariations,
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
          message: 'Failed to retrieve product variations - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Product variations GET error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new product variation
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const employeeId = await getEmployeeIdFromSession(request)
    
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid session - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const { versionId, variationName, color, size, capacity, barcode, price, quantity, minStockLevel, maxStockLevel, isActive } = body
    
    console.log(' Received data:', { versionId, variationName, color, size, capacity, barcode, price, quantity, minStockLevel, maxStockLevel, isActive });
    console.log(' Employee ID from session:', employeeId);

    if (!versionId || !variationName) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Version ID and variation name are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if variation already exists for this version with same attributes (only non-deleted)
      const existingVariation = await prisma.productvariation.findFirst({
        where: {
          versionId: parseInt(versionId),
          variationName,
          color: color || '',
          size: size || '',
          capacity: capacity || '',
          deletedAt: null
        }
      })

      if (existingVariation) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'Product variation already exists',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }

      // Check if barcode already exists (if provided) (only non-deleted)
      if (barcode) {
        const existingBarcode = await prisma.productvariation.findFirst({
          where: {
            barcode,
            deletedAt: null
          }
        })

        if (existingBarcode) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'Barcode already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // Check if version exists
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
            code: 400,
            message: 'Invalid version ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Create new product variation
      const variation = await prisma.productvariation.create({
        data: {
          versionId: parseInt(versionId),
          variationName,
          color: color || '',
          size: size || '',
          capacity: capacity || '',
          barcode: barcode || '',
          price: parseFloat(price?.toString() || '0') || 0,
          quantity: parseInt(quantity?.toString() || '0') || 0,
          minStockLevel: parseInt(minStockLevel?.toString() || '0') || 0,
          maxStockLevel: parseInt(maxStockLevel?.toString() || '0') || 0,
          isActive: isActive !== undefined ? isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        },
        select: {
          variationId: true,
          versionId: true,
          variationName: true,
          color: true,
          size: true,
          capacity: true,
          barcode: true,
          price: true,
          quantity: true,
          minStockLevel: true,
          maxStockLevel: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      console.log(' Product variation created:', variation);

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'Product variation created successfully',
          timestamp: new Date().toISOString(),
          data: variation
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create product variation',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Product variations POST error:', error)
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

// PUT - Update product variation
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const employeeId = await getEmployeeIdFromSession(request)
    
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid session - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { variationId, ...updateData } = body

    console.log(' Update - Employee ID from session:', employeeId);
    
    if (!variationId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Variation ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if variation exists and is not deleted
      const existingVariation = await prisma.productvariation.findFirst({
        where: {
          variationId: parseInt(variationId),
          deletedAt: null
        }
      })

      if (!existingVariation) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Product variation not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if barcode already exists (excluding current variation and deleted ones)
      if (updateData.barcode) {
        const duplicateBarcode = await prisma.productvariation.findFirst({
          where: {
            barcode: updateData.barcode,
            variationId: { not: parseInt(variationId) },
            deletedAt: null
          }
        })

        if (duplicateBarcode) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'Barcode already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // If versionId is being updated, check if it exists
      if (updateData.versionId) {
        const existingVersion = await prisma.productversion.findFirst({
          where: {
            versionId: parseInt(updateData.versionId),
            deletedAt: null
          }
        })

        if (!existingVersion) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Invalid version ID',
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

      if (updateData.versionId !== undefined) prismaUpdateData.versionId = parseInt(updateData.versionId)
      if (updateData.variationName !== undefined) prismaUpdateData.variationName = updateData.variationName
      if (updateData.color !== undefined) prismaUpdateData.color = updateData.color
      if (updateData.size !== undefined) prismaUpdateData.size = updateData.size
      if (updateData.capacity !== undefined) prismaUpdateData.capacity = updateData.capacity
      if (updateData.barcode !== undefined) prismaUpdateData.barcode = updateData.barcode
      if (updateData.price !== undefined) prismaUpdateData.price = parseFloat(updateData.price?.toString() || '0')
      if (updateData.quantity !== undefined) prismaUpdateData.quantity = parseInt(updateData.quantity?.toString() || '0')
      if (updateData.minStockLevel !== undefined) prismaUpdateData.minStockLevel = parseInt(updateData.minStockLevel?.toString() || '0')
      if (updateData.maxStockLevel !== undefined) prismaUpdateData.maxStockLevel = parseInt(updateData.maxStockLevel?.toString() || '0')
      if (updateData.isActive !== undefined) prismaUpdateData.isActive = updateData.isActive

      console.log(' Update data:', prismaUpdateData);

      // Update product variation
      const variation = await prisma.productvariation.update({
        where: {
          variationId: parseInt(variationId)
        },
        data: prismaUpdateData,
        select: {
          variationId: true,
          versionId: true,
          variationName: true,
          color: true,
          size: true,
          capacity: true,
          barcode: true,
          price: true,
          quantity: true,
          minStockLevel: true,
          maxStockLevel: true,
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
          message: 'Product variation updated successfully',
          timestamp: new Date().toISOString(),
          data: variation
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update product variation',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Product variations PUT error:', error)
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

// DELETE - Delete product variation (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const employeeId = await getEmployeeIdFromSession(request)
    
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid session - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const variationId = searchParams.get('variationId') || searchParams.get('id')

    if (!variationId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Variation ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if variation exists and is not already deleted
      const existingVariation = await prisma.productvariation.findFirst({
        where: {
          variationId: parseInt(variationId),
          deletedAt: null
        }
      })

      if (!existingVariation) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Product variation not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if variation is being used by any spec details
      const specDetailsUsingVariation = await prisma.specdetails.findFirst({
        where: {
          variationId: parseInt(variationId),
          deletedAt: null
        }
      })

      if (specDetailsUsingVariation) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Cannot delete product variation that is being used by spec details',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Soft delete the product variation
      await prisma.productvariation.update({
        where: {
          variationId: parseInt(variationId)
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
          message: 'Product variation deleted successfully',
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
          message: 'Failed to delete product variation',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Product variations DELETE error:', error)
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
 * /api/productvariation:
 *   get:
 *     tags:
 *       - Product Variations
 *     summary: Get all product variations
 *     description: Retrieve all product variations with pagination, sorting, search, and filtering
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
 *           default: variationName
 *           enum: [variationName, variationId, versionId, color, size, capacity, price, quantity, isActive, createdAt]
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
 *         description: Search term for variation name, barcode, color, or size
 *       - in: query
 *         name: versionId
 *         schema:
 *           type: integer
 *         description: Filter by version ID
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by color
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Filter by size
 *       - in: query
 *         name: capacity
 *         schema:
 *           type: string
 *         description: Filter by capacity
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Product variations retrieved successfully
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
 *                             $ref: '#/components/schemas/ProductVariation'
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
 * /api/productvariation:
 *   post:
 *     tags:
 *       - Product Variations
 *     summary: Create a new product variation
 *     description: Create a new product variation in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - versionId
 *               - variationName
 *             properties:
 *               versionId:
 *                 type: integer
 *                 description: Product version ID
 *                 example: 1
 *               variationName:
 *                 type: string
 *                 description: Variation name
 *                 example: "16GB RAM / 512GB SSD / Space Gray"
 *               color:
 *                 type: string
 *                 description: Color
 *                 example: "Space Gray"
 *               size:
 *                 type: string
 *                 description: Size
 *                 example: "16-inch"
 *               capacity:
 *                 type: string
 *                 description: Storage capacity
 *                 example: "512GB"
 *               barcode:
 *                 type: string
 *                 description: Barcode (unique if provided)
 *                 example: "1234567890123"
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Price
 *                 example: 2499.99
 *               quantity:
 *                 type: integer
 *                 description: Initial quantity
 *                 example: 10
 *               minStockLevel:
 *                 type: integer
 *                 description: Minimum stock level
 *                 example: 5
 *               maxStockLevel:
 *                 type: integer
 *                 description: Maximum stock level
 *                 example: 50
 *               isActive:
 *                 type: boolean
 *                 description: Active status
 *                 default: true
 *     responses:
 *       201:
 *         description: Product variation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProductVariation'
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
 *         description: Product variation or barcode already exists
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
 * /api/productvariation:
 *   put:
 *     tags:
 *       - Product Variations
 *     summary: Update a product variation
 *     description: Update an existing product variation in the system
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
 *                   - variationId
 *                 properties:
 *                   variationId:
 *                     type: integer
 *                     description: Variation ID to update
 *                     example: 1
 *               - type: object
 *                 properties:
 *                   versionId:
 *                     type: integer
 *                     description: Product version ID
 *                     example: 1
 *                   variationName:
 *                     type: string
 *                     description: Variation name
 *                     example: "32GB RAM / 1TB SSD / Space Gray"
 *                   color:
 *                     type: string
 *                     description: Color
 *                     example: "Space Gray"
 *                   size:
 *                     type: string
 *                     description: Size
 *                     example: "16-inch"
 *                   capacity:
 *                     type: string
 *                     description: Storage capacity
 *                     example: "1TB"
 *                   barcode:
 *                     type: string
 *                     description: Barcode
 *                     example: "1234567890124"
 *                   price:
 *                     type: number
 *                     format: float
 *                     description: Price
 *                     example: 2999.99
 *                   quantity:
 *                     type: integer
 *                     description: Quantity
 *                     example: 15
 *                   minStockLevel:
 *                     type: integer
 *                     description: Minimum stock level
 *                     example: 5
 *                   maxStockLevel:
 *                     type: integer
 *                     description: Maximum stock level
 *                     example: 50
 *                   isActive:
 *                     type: boolean
 *                     description: Active status
 *     responses:
 *       200:
 *         description: Product variation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProductVariation'
 *       400:
 *         description: Bad request - Missing variation ID
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
 *         description: Product variation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: Barcode already exists
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
 * /api/productvariation:
 *   delete:
 *     tags:
 *       - Product Variations
 *     summary: Delete a product variation
 *     description: Delete a product variation from the system
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: variationId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Variation ID to delete
 *         example: 1
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative variation ID parameter
 *         example: 1
 *     responses:
 *       200:
 *         description: Product variation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - Missing variation ID
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
 *         description: Product variation not found
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