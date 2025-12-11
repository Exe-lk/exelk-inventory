// import { NextRequest, NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase/server'
// import { verifyAccessToken } from '@/lib/jwt'
// import { getAuthTokenFromCookies } from '@/lib/cookies'

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



// // GET - Retrieve spec details with pagination, sorting, search, and filtering
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
//     const sortBy = searchParams.get('sortBy') || 'specValue'
//     const sortOrder = searchParams.get('sortOrder') || 'asc'
//     const search = searchParams.get('search') || ''
//     const variationId = searchParams.get('variationId')
//     const specId = searchParams.get('specId')

//     // Calculate offset for pagination
//     const offset = (page - 1) * limit

//     // Build query - select only non-deleted records
//     let query = supabase
//       .from('specdetails')
//       .select(`
//         specDetailId,
//         variationId,
//         specId,
//         specValue,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy
//       `, { count: 'exact' })
//       .is('deletedAt', null)

//     // Apply search filter
//     if (search) {
//       query = query.ilike('specValue', `%${search}%`)
//     }

//     // Apply filters
//     if (variationId) {
//       query = query.eq('variationId', variationId)
//     }

//     if (specId) {
//       query = query.eq('specId', specId)
//     }

//     // Apply sorting
//     const dbSortBy = sortBy === 'specDetailId' ? 'specDetailId' : 
//                      sortBy === 'variationId' ? 'variationId' :
//                      sortBy === 'specId' ? 'specId' :
//                      sortBy === 'specValue' ? 'specValue' :
//                      sortBy === 'createdAt' ? 'createdAt' : 'specValue'

//     query = query.order(dbSortBy, { ascending: sortOrder === 'asc' })

//     // Apply pagination
//     query = query.range(offset, offset + limit - 1)

//     const { data: specDetails, error, count } = await query

//     if (error) {
//       console.error('Error fetching spec details:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to retrieve spec details',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     // Transform data to match response format
//     const transformedSpecDetails = specDetails?.map(specDetail => ({
//       specDetailId: specDetail.specDetailId,
//       variationId: specDetail.variationId,
//       specId: specDetail.specId,
//       specValue: specDetail.specValue,
//       createdAt: specDetail.createdAt,
//       updatedAt: specDetail.updatedAt
//     })) || []

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Spec details retrieved successfully',
//         timestamp: new Date().toISOString(),
//         data: {
//           items: transformedSpecDetails,
//           pagination: {
//             totalItems: count || 0,
//             page,
//             limit,
//             totalPages: Math.ceil((count || 0) / limit)
//           },
//           sorting: {
//             sortBy,
//             sortOrder
//           },
//           search: search || null,
//           filters: {
//             variationId: variationId || null,
//             specId: specId || null
//           }
//         }
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Spec details GET error:', error)
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



// // POST - Create new spec detail
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

//     let loggedInEmployeeId: number;
//     try {
//       verifyAccessToken(accessToken)
//       loggedInEmployeeId = getEmployeeIdFromToken(accessToken)
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
//     const { variationId, specId, specValue } = body
//     if (!variationId || !specId || !specValue) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Variation ID, spec ID, and spec value are required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Check if spec detail with same variation and spec already exists (only non-deleted)
//     const { data: existingSpecDetail, error: checkError } = await supabase
//       .from('specdetails')
//       .select('specDetailId')
//       .eq('variationId', variationId)
//       .eq('specId', specId)
//       .is('deletedAt', null)
//       .maybeSingle()

//     if (checkError) {
//       console.error('Error checking existing spec detail:', checkError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check existing spec detail',
//           error: checkError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (existingSpecDetail) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 409,
//           message: 'Spec detail with this variation and spec already exists',
//           timestamp: new Date().toISOString()
//         },
//         { status: 409 }
//       )
//     }

//     // Prepare spec detail data with logged-in employee ID
//     const currentTimestamp = new Date().toISOString();
//     const specDetailData = {
//       variationId,
//       specId,
//       specValue,
//       createdAt: currentTimestamp,
//       createdBy: loggedInEmployeeId,
//       updatedAt: currentTimestamp,
//       updatedBy: loggedInEmployeeId
//     }
    
//     const { data: specDetail, error } = await supabase
//       .from('specdetails')
//       .insert([specDetailData])
//       .select(`
//         specDetailId,
//         variationId,
//         specId,
//         specValue,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy
//       `)
//       .single()

//     if (error) {
//       console.error('Error creating spec detail:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to create spec detail',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     // Transform response
//     const transformedSpecDetail = {
//       specDetailId: specDetail.specDetailId,
//       variationId: specDetail.variationId,
//       specId: specDetail.specId,
//       specValue: specDetail.specValue,
//       createdAt: specDetail.createdAt,
//       updatedAt: specDetail.updatedAt
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 201,
//         message: 'Spec detail created successfully',
//         timestamp: new Date().toISOString(),
//         data: transformedSpecDetail
//       },
//       { status: 201 }
//     )

//   } catch (error) {
//     console.error('Spec details POST error:', error)
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


// // PUT - Update spec detail
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

//     let loggedInEmployeeId: number;
//     try {
//       verifyAccessToken(accessToken)
//       loggedInEmployeeId = getEmployeeIdFromToken(accessToken)
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
//     const { specDetailId, ...updateData } = body
    
//     if (!specDetailId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Spec detail ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Check if spec detail exists and is not deleted
//     const { data: existingSpecDetailCheck, error: existsError } = await supabase
//       .from('specdetails')
//       .select('specDetailId')
//       .eq('specDetailId', specDetailId)
//       .is('deletedAt', null)
//       .maybeSingle()

//     if (existsError) {
//       console.error('Error checking spec detail existence:', existsError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check spec detail existence',
//           error: existsError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (!existingSpecDetailCheck) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Spec detail not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     // Check if variation and spec combination already exists (excluding current spec detail and deleted ones)
//     if (updateData.variationId && updateData.specId) {
//       const { data: duplicateSpecDetail } = await supabase
//         .from('specdetails')
//         .select('specDetailId')
//         .eq('variationId', updateData.variationId)
//         .eq('specId', updateData.specId)
//         .neq('specDetailId', specDetailId)
//         .is('deletedAt', null)
//         .maybeSingle()

//       if (duplicateSpecDetail) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 409,
//             message: 'Spec detail with this variation and spec already exists',
//             timestamp: new Date().toISOString()
//           },
//           { status: 409 }
//         )
//       }
//     }

//     // Add update timestamp and logged-in employee ID
//     const updateDataWithTimestamp = {
//       ...updateData,
//       updatedAt: new Date().toISOString(),
//       updatedBy: loggedInEmployeeId
//     }
    
//     const { data: specDetail, error } = await supabase
//       .from('specdetails')
//       .update(updateDataWithTimestamp)
//       .eq('specDetailId', specDetailId)
//       .select(`
//         specDetailId,
//         variationId,
//         specId,
//         specValue,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy
//       `)
//       .single()

//     if (error) {
//       console.error('Error updating spec detail:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to update spec detail',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     if (!specDetail) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Spec detail not found after update',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     // Transform response
//     const transformedSpecDetail = {
//       specDetailId: specDetail.specDetailId,
//       variationId: specDetail.variationId,
//       specId: specDetail.specId,
//       specValue: specDetail.specValue,
//       createdAt: specDetail.createdAt,
//       updatedAt: specDetail.updatedAt
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Spec detail updated successfully',
//         timestamp: new Date().toISOString(),
//         data: transformedSpecDetail
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Spec details PUT error:', error)
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

// // DELETE - Delete spec detail (soft delete)
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

//     let loggedInEmployeeId: number;
//     try {
//       verifyAccessToken(accessToken)
//       loggedInEmployeeId = getEmployeeIdFromToken(accessToken)
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
//     const specDetailId = searchParams.get('specDetailId') || searchParams.get('id')

//     if (!specDetailId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Spec detail ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     const supabase = createServerClient()

//     // Check if spec detail exists and is not already deleted
//     const { data: existingSpecDetail, error: fetchError } = await supabase
//       .from('specdetails')
//       .select('specDetailId')
//       .eq('specDetailId', specDetailId)
//       .is('deletedAt', null)
//       .maybeSingle()

//     if (fetchError) {
//       console.error('Error checking existing spec detail:', fetchError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check spec detail existence',
//           error: fetchError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (!existingSpecDetail) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Spec detail not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }
    
//     // Soft delete the spec detail with logged-in employee ID
//     const { error } = await supabase
//       .from('specdetails')
//       .update({
//         deletedAt: new Date().toISOString(),
//         deletedBy: loggedInEmployeeId
//       })
//       .eq('specDetailId', specDetailId)

//     if (error) {
//       console.error('Error deleting spec detail:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to delete spec detail',
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
//         message: 'Spec detail deleted successfully',
//         timestamp: new Date().toISOString()
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Spec details DELETE error:', error)
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

interface SpecDetail {
  specDetailId: number
  variationId: number
  specId: number
  specValue: string
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


// GET - Retrieve spec details with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' SpecDetail GET request started');
  
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
      console.log(' Invalid access token:', error);
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
    const sortBy = searchParams.get('sortBy') || 'specValue'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const variationId = searchParams.get('variationId')
    const specId = searchParams.get('specId')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, variationId, specId });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only get non-deleted spec details
    }

    // Apply search filter
    if (search) {
      where.specValue = { contains: search, mode: 'insensitive' }
    }

    // Apply filters
    if (variationId) {
      where.variationId = parseInt(variationId)
    }

    if (specId) {
      where.specId = parseInt(specId)
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['specDetailId', 'variationId', 'specId', 'specValue', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'specValue'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {
      console.log(' Testing database connection...');
      await prisma.$connect();
      console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.specdetails.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get spec details with pagination
      console.log(' Fetching spec details...');
      const specDetails: SpecDetail[] = await prisma.specdetails.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          specDetailId: true,
          variationId: true,
          specId: true,
          specValue: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      }) as SpecDetail[];

      console.log(` Found ${specDetails.length} spec details`);

      // Transform data to match response format
      const transformedSpecDetails = specDetails.map((specDetail: any) => ({
        specDetailId: specDetail.specDetailId,
        variationId: specDetail.variationId,
        specId: specDetail.specId,
        specValue: specDetail.specValue,
        createdAt: specDetail.createdAt,
        updatedAt: specDetail.updatedAt
      }));

      console.log(' Spec details transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Spec details retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedSpecDetails,
            pagination: {
              totalItems: totalCount,
              page,
              limit,
              totalPages: Math.ceil(totalCount / limit)
            },
            sorting: {
              sortBy,
              sortOrder
            },
            search: search || null,
            filters: {
              variationId: variationId || null,
              specId: specId || null
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
          message: 'Failed to retrieve spec details - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Spec details GET error:', error);
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


// POST - Create new spec detail
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
    const { variationId, specId, specValue } = body
    
    console.log(' Received data:', { variationId, specId, specValue });
    console.log(' Employee ID from token:', employeeId);

    if (!variationId || !specId || !specValue) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Variation ID, spec ID, and spec value are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if spec detail with same variation and spec already exists (only non-deleted)
      const existingSpecDetail = await prisma.specdetails.findFirst({
        where: {
          variationId: parseInt(variationId),
          specId: parseInt(specId),
          deletedAt: null
        }
      })

      if (existingSpecDetail) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'Spec detail with this variation and spec already exists',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }

      // Check if variation exists
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
            code: 400,
            message: 'Invalid variation ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Check if spec exists
      const existingSpec = await prisma.specs.findFirst({
        where: {
          specId: parseInt(specId),
          deletedAt: null
        }
      })

      if (!existingSpec) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid spec ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Create new spec detail
      const specDetail = await prisma.specdetails.create({
        data: {
          variationId: parseInt(variationId),
          specId: parseInt(specId),
          specValue,
          createdBy: employeeId,
          updatedBy: employeeId
        },
        select: {
          specDetailId: true,
          variationId: true,
          specId: true,
          specValue: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      console.log(' Spec detail created:', specDetail);

      // Transform response
      const transformedSpecDetail = {
        specDetailId: specDetail.specDetailId,
        variationId: specDetail.variationId,
        specId: specDetail.specId,
        specValue: specDetail.specValue,
        createdAt: specDetail.createdAt,
        updatedAt: specDetail.updatedAt
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'Spec detail created successfully',
          timestamp: new Date().toISOString(),
          data: transformedSpecDetail
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create spec detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Spec details POST error:', error)
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


// PUT - Update spec detail
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
    const { specDetailId, ...updateData } = body

    console.log(' Update - Employee ID from token:', employeeId);
    
    if (!specDetailId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Spec detail ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if spec detail exists and is not deleted
      const existingSpecDetail = await prisma.specdetails.findFirst({
        where: {
          specDetailId: parseInt(specDetailId),
          deletedAt: null
        }
      })

      if (!existingSpecDetail) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Spec detail not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if variation and spec combination already exists (excluding current spec detail and deleted ones)
      if (updateData.variationId && updateData.specId) {
        const duplicateSpecDetail = await prisma.specdetails.findFirst({
          where: {
            variationId: parseInt(updateData.variationId),
            specId: parseInt(updateData.specId),
            specDetailId: { not: parseInt(specDetailId) },
            deletedAt: null
          }
        })

        if (duplicateSpecDetail) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'Spec detail with this variation and spec already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // If variationId is being updated, check if it exists
      if (updateData.variationId) {
        const existingVariation = await prisma.productvariation.findFirst({
          where: {
            variationId: parseInt(updateData.variationId),
            deletedAt: null
          }
        })

        if (!existingVariation) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Invalid variation ID',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
      }

      // If specId is being updated, check if it exists
      if (updateData.specId) {
        const existingSpec = await prisma.specs.findFirst({
          where: {
            specId: parseInt(updateData.specId),
            deletedAt: null
          }
        })

        if (!existingSpec) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Invalid spec ID',
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

      if (updateData.variationId !== undefined) prismaUpdateData.variationId = parseInt(updateData.variationId)
      if (updateData.specId !== undefined) prismaUpdateData.specId = parseInt(updateData.specId)
      if (updateData.specValue !== undefined) prismaUpdateData.specValue = updateData.specValue

      console.log('📝 Update data:', prismaUpdateData);

      // Update spec detail
      const specDetail = await prisma.specdetails.update({
        where: {
          specDetailId: parseInt(specDetailId)
        },
        data: prismaUpdateData,
        select: {
          specDetailId: true,
          variationId: true,
          specId: true,
          specValue: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      // Transform response
      const transformedSpecDetail = {
        specDetailId: specDetail.specDetailId,
        variationId: specDetail.variationId,
        specId: specDetail.specId,
        specValue: specDetail.specValue,
        createdAt: specDetail.createdAt,
        updatedAt: specDetail.updatedAt
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Spec detail updated successfully',
          timestamp: new Date().toISOString(),
          data: transformedSpecDetail
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update spec detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Spec details PUT error:', error)
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

// DELETE - Delete spec detail (soft delete)
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
    const specDetailId = searchParams.get('specDetailId') || searchParams.get('id')

    if (!specDetailId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Spec detail ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if spec detail exists and is not already deleted
      const existingSpecDetail = await prisma.specdetails.findFirst({
        where: {
          specDetailId: parseInt(specDetailId),
          deletedAt: null
        }
      })

      if (!existingSpecDetail) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Spec detail not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Soft delete the spec detail
      await prisma.specdetails.update({
        where: {
          specDetailId: parseInt(specDetailId)
        },
        data: {
          deletedAt: new Date(),
          deletedBy: employeeId
        }
      })

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Spec detail deleted successfully',
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
          message: 'Failed to delete spec detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Spec details DELETE error:', error)
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
 * /api/specdetails:
 *   get:
 *     tags:
 *       - Specification Details
 *     summary: Get all specification details
 *     description: Retrieve all specification details with pagination, sorting, search, and filtering
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
 *           default: specValue
 *           enum: [specDetailId, variationId, specId, specValue, createdAt]
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
 *         description: Search term for specification value
 *       - in: query
 *         name: variationId
 *         schema:
 *           type: integer
 *         description: Filter by variation ID
 *       - in: query
 *         name: specId
 *         schema:
 *           type: integer
 *         description: Filter by specification ID
 *     responses:
 *       200:
 *         description: Specification details retrieved successfully
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
 *                             type: object
 *                             properties:
 *                               specDetailId:
 *                                 type: integer
 *                                 description: Specification detail ID
 *                                 example: 1
 *                               variationId:
 *                                 type: integer
 *                                 description: Product variation ID
 *                                 example: 1
 *                               specId:
 *                                 type: integer
 *                                 description: Specification ID
 *                                 example: 1
 *                               specValue:
 *                                 type: string
 *                                 description: Specification value
 *                                 example: "16GB"
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                         sorting:
 *                           type: object
 *                           properties:
 *                             sortBy:
 *                               type: string
 *                             sortOrder:
 *                               type: string
 *                         search:
 *                           type: string
 *                           nullable: true
 *                         filters:
 *                           type: object
 *                           properties:
 *                             variationId:
 *                               type: integer
 *                               nullable: true
 *                             specId:
 *                               type: integer
 *                               nullable: true
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
 * /api/specdetails:
 *   post:
 *     tags:
 *       - Specification Details
 *     summary: Create a new specification detail
 *     description: Create a new specification detail in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variationId
 *               - specId
 *               - specValue
 *             properties:
 *               variationId:
 *                 type: integer
 *                 description: Product variation ID
 *                 example: 1
 *               specId:
 *                 type: integer
 *                 description: Specification ID
 *                 example: 1
 *               specValue:
 *                 type: string
 *                 description: Specification value
 *                 example: "16GB"
 *     responses:
 *       201:
 *         description: Specification detail created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         specDetailId:
 *                           type: integer
 *                         variationId:
 *                           type: integer
 *                         specId:
 *                           type: integer
 *                         specValue:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
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
 *         description: Specification detail with this variation and spec already exists
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
 * /api/specdetails:
 *   put:
 *     tags:
 *       - Specification Details
 *     summary: Update a specification detail
 *     description: Update an existing specification detail in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specDetailId
 *             properties:
 *               specDetailId:
 *                 type: integer
 *                 description: Specification detail ID to update
 *                 example: 1
 *               variationId:
 *                 type: integer
 *                 description: Product variation ID
 *                 example: 1
 *               specId:
 *                 type: integer
 *                 description: Specification ID
 *                 example: 1
 *               specValue:
 *                 type: string
 *                 description: Specification value
 *                 example: "32GB"
 *     responses:
 *       200:
 *         description: Specification detail updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         specDetailId:
 *                           type: integer
 *                         variationId:
 *                           type: integer
 *                         specId:
 *                           type: integer
 *                         specValue:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Missing specification detail ID
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
 *         description: Specification detail not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: Specification detail with this variation and spec already exists
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
 * /api/specdetails:
 *   delete:
 *     tags:
 *       - Specification Details
 *     summary: Delete a specification detail
 *     description: Soft delete a specification detail from the system
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: specDetailId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Specification detail ID to delete
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative specification detail ID parameter
 *     responses:
 *       200:
 *         description: Specification detail deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - Missing specification detail ID
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
 *         description: Specification detail not found
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
