// import { NextRequest, NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase/server'
// import { verifyAccessToken } from '@/lib/jwt'
// import { getAuthTokenFromCookies } from '@/lib/cookies'

// // Helper function to extract employee ID from token
// function getEmployeeIdFromToken(accessToken: string): number {
//   try {
//     const payload = verifyAccessToken(accessToken);
//     // Assuming the token payload contains userId which is the EmployeeID
//     return payload.userId || 1; // fallback to 1 if not found
//   } catch (error) {
//     console.error('Error extracting employee ID from token:', error);
//     return 1; // fallback employee ID
//   }
// }

// // GET - Retrieve brands with pagination, sorting, search, and filtering
// export async function GET(request: NextRequest) {
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

//     try {
//       verifyAccessToken(accessToken)
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

//     const supabase = createServerClient()
//     const { searchParams } = new URL(request.url)

//     // Parse query parameters
//     const page = parseInt(searchParams.get('page') || '1')
//     const limit = parseInt(searchParams.get('limit') || '100')
//     const sortBy = searchParams.get('sortBy') || 'brandName'
//     const sortOrder = searchParams.get('sortOrder') || 'asc'
//     const search = searchParams.get('search') || ''
//     const country = searchParams.get('country')
//     const isActive = searchParams.get('isActive')

//     // Calculate offset for pagination
//     const offset = (page - 1) * limit

//     // Build query - use camelCase column names
//     let query = supabase
//       .from('brand')
//       .select(`
//         brandId,
//         brandName,
//         description,
//         country,
//         isActive,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy,
//         deletedAt,
//         deletedBy
//       `, { count: 'exact' })

//     // Apply search filter (camelCase column names)
//     if (search) {
//       query = query.or(`brandName.ilike.%${search}%,description.ilike.%${search}%`)
//     }

//     // Apply filters (camelCase column names)
//     if (country) {
//       query = query.eq('country', country)
//     }

//     if (isActive !== null && isActive !== undefined && isActive !== '') {
//       query = query.eq('isActive', isActive === 'true')
//     }

//     // Apply sorting (camelCase column names)
//     const dbSortBy = sortBy === 'brandName' ? 'brandName' : 
//                      sortBy === 'brandId' ? 'brandId' :
//                      sortBy === 'description' ? 'description' :
//                      sortBy === 'country' ? 'country' :
//                      sortBy === 'isActive' ? 'isActive' :
//                      sortBy === 'createdAt' ? 'createdAt' : 'brandName'

//     query = query.order(dbSortBy, { ascending: sortOrder === 'asc' })

//     // Apply pagination
//     query = query.range(offset, offset + limit - 1)

//     const { data: brands, error, count } = await query

//     if (error) {
//       console.error('Error fetching brands:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to retrieve brands',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     // Transform data to match response format (keep camelCase)
//     const transformedBrands = brands?.map(brand => ({
//       brandID: brand.brandId,
//       brandName: brand.brandName,
//       description: brand.description,
//       country: brand.country,
//       isActive: brand.isActive,
//       createdAt: brand.createdAt,
//       createdBy: brand.createdBy || 1,
//       updatedAt: brand.updatedAt,
//       updatedBy: brand.updatedBy || 1,
//       deletedAt: brand.deletedAt,
//       deletedBy: brand.deletedBy
//     })) || []

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Brands retrieved successfully',
//         timestamp: new Date().toISOString(),
//         data: {
//           items: transformedBrands,
//           pagination: {
//             totalItems: count || 0,
//             page,
//             limit,
//             totalPages: Math.ceil((count || 0) / limit)
//           }
//         }
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Brands GET error:', error)
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

// // POST - Create new brand
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
//       // Extract employee ID from token
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

//     const supabase = createServerClient()
//     const body = await request.json()
    
//     // Validate required fields
//     const { brandName, description, country, isActive } = body
//     if (!brandName) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Brand name is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Check if brand name already exists (camelCase column names)
//     const { data: existingBrand, error: checkError } = await supabase
//       .from('brand')
//       .select('brandId')
//       .eq('brandName', brandName)
//       .maybeSingle()

//     if (checkError) {
//       console.error('Error checking existing brand:', checkError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check existing brand',
//           error: checkError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (existingBrand) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 409,
//           message: 'Brand name already exists',
//           timestamp: new Date().toISOString()
//         },
//         { status: 409 }
//       )
//     }

//     // Prepare brand data with logged-in employee ID (camelCase)
//     const currentTimestamp = new Date().toISOString();
//     const brandData = {
//       brandName,
//       description: description || '',
//       country: country || '',
//       isActive: isActive !== undefined ? isActive : true,
//       createdAt: currentTimestamp,
//       createdBy: employeeId, // Use logged-in employee ID
//       updatedAt: currentTimestamp,
//       updatedBy: employeeId  // Use logged-in employee ID
//     }
    
//     const { data: brand, error } = await supabase
//       .from('brand')
//       .insert([brandData])
//       .select(`
//         brandId,
//         brandName,
//         description,
//         country,
//         isActive,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy,
//         deletedAt,
//         deletedBy
//       `)
//       .single()

//     if (error) {
//       console.error('Error creating brand:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to create brand',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     // Transform response (keep camelCase)
//     const transformedBrand = {
//       brandID: brand.brandId,
//       brandName: brand.brandName,
//       description: brand.description,
//       country: brand.country,
//       isActive: brand.isActive,
//       createdAt: brand.createdAt,
//       createdBy: brand.createdBy,
//       updatedAt: brand.updatedAt,
//       updatedBy: brand.updatedBy,
//       deletedAt: brand.deletedAt,
//       deletedBy: brand.deletedBy
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 201,
//         message: 'Brand created successfully',
//         timestamp: new Date().toISOString(),
//         data: transformedBrand
//       },
//       { status: 201 }
//     )

//   } catch (error) {
//     console.error('Brands POST error:', error)
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

// // PUT - Update brand
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
//       // Extract employee ID from token
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

//     const supabase = createServerClient()
//     const body = await request.json()
//     const { brandId, ...updateData } = body
    
//     if (!brandId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Brand ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Check if brand exists first
//     const { data: existingBrandCheck, error: existsError } = await supabase
//       .from('brand')
//       .select('brandId')
//       .eq('brandId', brandId)
//       .maybeSingle()

//     if (existsError) {
//       console.error('Error checking brand existence:', existsError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check brand existence',
//           error: existsError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (!existingBrandCheck) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Brand not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     // Check if brand name already exists (excluding current brand) - camelCase
//     if (updateData.brandName) {
//       const { data: duplicateBrand } = await supabase
//         .from('brand')
//         .select('brandId')
//         .eq('brandName', updateData.brandName)
//         .neq('brandId', brandId)
//         .maybeSingle()

//       if (duplicateBrand) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 409,
//             message: 'Brand name already exists',
//             timestamp: new Date().toISOString()
//           },
//           { status: 409 }
//         )
//       }
//     }

//     // Add update timestamp and logged-in employee ID (camelCase)
//     const updateDataWithTimestamp = {
//       ...updateData,
//       updatedAt: new Date().toISOString(),
//       updatedBy: employeeId // Use logged-in employee ID
//     }
    
//     const { data: brand, error } = await supabase
//       .from('brand')
//       .update(updateDataWithTimestamp)
//       .eq('brandId', brandId)
//       .select(`
//         brandId,
//         brandName,
//         description,
//         country,
//         isActive,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy,
//         deletedAt,
//         deletedBy
//       `)
//       .single()

//     if (error) {
//       console.error('Error updating brand:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to update brand',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     if (!brand) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Brand not found after update',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     // Transform response (keep camelCase)
//     const transformedBrand = {
//       brandID: brand.brandId,
//       brandName: brand.brandName,
//       description: brand.description,
//       country: brand.country,
//       isActive: brand.isActive,
//       createdAt: brand.createdAt,
//       createdBy: brand.createdBy,
//       updatedAt: brand.updatedAt,
//       updatedBy: brand.updatedBy,
//       deletedAt: brand.deletedAt,
//       deletedBy: brand.deletedBy
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Brand updated successfully',
//         timestamp: new Date().toISOString(),
//         data: transformedBrand
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Brands PUT error:', error)
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

// // DELETE - Delete brand
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
//       // Extract employee ID from token for potential soft delete tracking
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
//     const brandId = searchParams.get('brandId') || searchParams.get('brandID') || searchParams.get('id')

//     if (!brandId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Brand ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     const supabase = createServerClient()

//     // Check if brand exists (camelCase)
//     const { data: existingBrand, error: fetchError } = await supabase
//       .from('brand')
//       .select('brandId')
//       .eq('brandId', brandId)
//       .maybeSingle()

//     if (fetchError) {
//       console.error('Error checking existing brand:', fetchError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check brand existence',
//           error: fetchError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (!existingBrand) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Brand not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     // Optional: Check if brand is being used by any products/models (camelCase)
//     const { data: productsUsingBrand } = await supabase
//       .from('model')
//       .select('modelId')
//       .eq('brandId', brandId)
//       .limit(1)

//     if (productsUsingBrand && productsUsingBrand.length > 0) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Cannot delete brand that is being used by models/products',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }
    
//     // If you want to implement soft delete instead of hard delete, use this:
//     // const { error } = await supabase
//     //   .from('brand')
//     //   .update({
//     //     deletedAt: new Date().toISOString(),
//     //     deletedBy: employeeId,
//     //     isActive: false
//     //   })
//     //   .eq('brandId', brandId)

//     // Hard delete (current implementation)
//     const { error } = await supabase
//       .from('brand')
//       .delete()
//       .eq('brandId', brandId)

//     if (error) {
//       console.error('Error deleting brand:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to delete brand',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Brand deleted successfully',
//         timestamp: new Date().toISOString()
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Brands DELETE error:', error)
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
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

interface Brand {
  brandId: number
  brandName: string
  description: string | null
  country: string | null
  isActive: boolean
  createdAt: Date
  createdBy: number
  updatedAt: Date
  updatedBy: number
  deletedAt: Date | null
  deletedBy: number | null
}

// Helper function to extract employee ID from token
function getEmployeeIdFromToken(accessToken: string): number {
  try {
    const payload = verifyAccessToken(accessToken);
    return payload.userId || 1;
  } catch (error) {
    console.error('Error extracting employee ID from token:', error);
    return 1;
  }
}

// GET - Retrieve brands with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log('Brand GET request started');

  //  try {
  //   console.log(' Testing Prisma connection...')
  //   await prisma.$connect()
  //   console.log(' Prisma connected')
    
  //   const testCount = await prisma.brand.count()
  //   console.log(` Brand count: ${testCount}`)
    
  // } catch (testError) {
  //   console.error(' Initial test failed:', testError)
  //   return NextResponse.json({
  //     status: 'error',
  //     message: 'Database test failed',
  //     error: testError instanceof Error ? testError.message : 'Unknown'
  //   }, { status: 500 })
  // }

  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
      console.log(' No access token found');
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

    try {
      verifyAccessToken(accessToken)
      console.log(' Access token verified');
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const sortBy = searchParams.get('sortBy') || 'brandId'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country')
    const isActive = searchParams.get('isActive')

     console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, country, isActive });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only get non-deleted brands
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { brandName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Apply filters
    if (country) {
      where.country = country
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['brandName', 'brandId', 'description', 'country', 'isActive', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'brandName'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {

      console.log(' Testing database connection...');
      await prisma.$connect();
      console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.brand.count({ where })
      console.log(` Total count: ${totalCount}`);

      // Get brands with pagination
      console.log(' Fetching brands...');
      const brands: Brand[] = await prisma.brand.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          brandId: true,
          brandName: true,
          description: true,
          country: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      }) as Brand[];

      console.log(` Found ${brands.length} brands`);

      // Transform data to match response format
      const transformedBrands = brands.map(brand => ({
        brandID: brand.brandId,
        brandName: brand.brandName,
        description: brand.description,
        country: brand.country,
        isActive: brand.isActive,
        createdAt: brand.createdAt,
        createdBy: brand.createdBy || 1,
        updatedAt: brand.updatedAt,
        updatedBy: brand.updatedBy,
        deletedAt: brand.deletedAt,
        deletedBy: brand.deletedBy
      }));

      console.log(' Brands transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Brands retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedBrands,
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
      console.error('Database error:', dbError);
      console.error(' Error details:', {
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      });

      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve brands',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Brands GET error:', error)
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

// POST - Create new brand
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
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

    let employeeId: number;
    try {
      verifyAccessToken(accessToken)
      employeeId = getEmployeeIdFromToken(accessToken)
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const { brandName, description, country, isActive } = body
    if (!brandName) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Brand name is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if brand name already exists
      const existingBrand = await prisma.brand.findFirst({
        where: {
          brandName,
          deletedAt: null
        }
      })

      if (existingBrand) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'Brand name already exists',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }

      // Create new brand
      const brand = await prisma.brand.create({
        data: {
          brandName,
          description: description || '',
          country: country || '',
          isActive: isActive !== undefined ? isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        },
        select: {
          brandId: true,
          brandName: true,
          description: true,
          country: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      // Transform response
      const transformedBrand = {
        brandID: brand.brandId,
        brandName: brand.brandName,
        description: brand.description,
        country: brand.country,
        isActive: brand.isActive,
        createdAt: brand.createdAt,
        createdBy: brand.createdBy,
        updatedAt: brand.updatedAt,
        updatedBy: brand.updatedBy,
        deletedAt: brand.deletedAt,
        deletedBy: brand.deletedBy
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'Brand created successfully',
          timestamp: new Date().toISOString(),
          data: transformedBrand
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create brand',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Brands POST error:', error)
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

// PUT - Update brand
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
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

    let employeeId: number;
    try {
      verifyAccessToken(accessToken)
      employeeId = getEmployeeIdFromToken(accessToken)
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { brandId, ...updateData } = body
    
    if (!brandId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Brand ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if brand exists
      const existingBrand = await prisma.brand.findFirst({
        where: {
          brandId: parseInt(brandId),
          deletedAt: null
        }
      })

      if (!existingBrand) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Brand not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if brand name already exists (excluding current brand)
      if (updateData.brandName) {
        const duplicateBrand = await prisma.brand.findFirst({
          where: {
            brandName: updateData.brandName,
            brandId: { not: parseInt(brandId) },
            deletedAt: null
          }
        })

        if (duplicateBrand) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'Brand name already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // Update brand
      const brand = await prisma.brand.update({
        where: {
          brandId: parseInt(brandId)
        },
        data: {
          ...updateData,
          updatedBy: employeeId
        },
        select: {
          brandId: true,
          brandName: true,
          description: true,
          country: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      // Transform response
      const transformedBrand = {
        brandID: brand.brandId,
        brandName: brand.brandName,
        description: brand.description,
        country: brand.country,
        isActive: brand.isActive,
        createdAt: brand.createdAt,
        createdBy: brand.createdBy,
        updatedAt: brand.updatedAt,
        updatedBy: brand.updatedBy,
        deletedAt: brand.deletedAt,
        deletedBy: brand.deletedBy
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Brand updated successfully',
          timestamp: new Date().toISOString(),
          data: transformedBrand
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update brand',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Brands PUT error:', error)
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

// DELETE - Delete brand (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
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

    let employeeId: number;
    try {
      verifyAccessToken(accessToken)
      employeeId = getEmployeeIdFromToken(accessToken)
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId') || searchParams.get('brandID') || searchParams.get('id')

    if (!brandId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Brand ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if brand exists
      const existingBrand = await prisma.brand.findFirst({
        where: {
          brandId: parseInt(brandId),
          deletedAt: null
        }
      })

      if (!existingBrand) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Brand not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if brand is being used by any models
      const modelsUsingBrand = await prisma.model.findFirst({
        where: {
          brandId: parseInt(brandId),
          deletedAt: null
        }
      })

      if (modelsUsingBrand) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Cannot delete brand that is being used by models/products',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Soft delete the brand
      await prisma.brand.update({
        where: {
          brandId: parseInt(brandId)
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
          message: 'Brand deleted successfully',
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete brand',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Brands DELETE error:', error)
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





/**
 * @swagger
 * /api/brand:
 *   get:
 *     tags:
 *       - Brands
 *     summary: Get all brands
 *     description: Retrieve all brands with pagination, sorting, search, and filtering
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
 *           default: brandName
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
 *         description: Search term
  *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
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
 *                             $ref: '#/components/schemas/Brand'
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
 * /api/brand:
 *   post:
 *     tags:
 *       - Brands
 *     summary: Create a new brand
 *     description: Create a new brand in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBrandRequest'
 *     responses:
 *       201:
 *         description: Brand created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Brand'
 *       400:
 *         description: Bad request
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
 *         description: Brand already exists
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
 * /api/brand:
 *   put:
 *     tags:
 *       - Brands
 *     summary: Update a brand
 *     description: Update an existing brand in the system
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
 *                   - brandId
 *                 properties:
 *                   brandId:
 *                     type: integer
 *                     description: Brand ID to update
 *               - $ref: '#/components/schemas/CreateBrandRequest'
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Brand'
 *       400:
 *         description: Bad request - Missing brand ID
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
 *         description: Brand not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: Brand name already exists
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
 * /api/brand:
 *   delete:
 *     tags:
 *       - Brands
 *     summary: Delete a brand
 *     description: Soft delete a brand from the system
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: brandId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Brand ID to delete
 *       - in: query
 *         name: brandID
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative brand ID parameter
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative ID parameter
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - Missing brand ID or brand in use
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
 *         description: Brand not found
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
