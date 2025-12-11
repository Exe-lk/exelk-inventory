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




// // GET - Retrieve specs with pagination, sorting, search, and filtering
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
//     const sortBy = searchParams.get('sortBy') || 'specName'
//     const sortOrder = searchParams.get('sortOrder') || 'asc'
//     const search = searchParams.get('search') || ''

//     // Calculate offset for pagination
//     const offset = (page - 1) * limit

//     // Build query - select only non-deleted records
//     let query = supabase
//       .from('specs')
//       .select(`
//         specId,
//         specName,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy
//       `, { count: 'exact' })
//       .is('deletedAt', null) // Only get non-deleted specs

//     // Apply search filter
//     if (search) {
//       query = query.ilike('specName', `%${search}%`)
//     }

//     // Apply sorting
//     const dbSortBy = sortBy === 'specName' ? 'specName' : 
//                      sortBy === 'specId' ? 'specId' :
//                      sortBy === 'createdAt' ? 'createdAt' : 'specName'

//     query = query.order(dbSortBy, { ascending: sortOrder === 'asc' })

//     // Apply pagination
//     query = query.range(offset, offset + limit - 1)

//     const { data: specs, error, count } = await query

//     if (error) {
//       console.error('Error fetching specs:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to retrieve specs',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     // Transform data to match response format
//     const transformedSpecs = specs?.map(spec => ({
//       specId: spec.specId,
//       specName: spec.specName,
//       createdAt: spec.createdAt,
//       updatedAt: spec.updatedAt
//     })) || []

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Specs retrieved successfully',
//         timestamp: new Date().toISOString(),
//         data: {
//           items: transformedSpecs,
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
//           search: search || null
//         }
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Specs GET error:', error)
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


// // POST - Create new spec
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
//     const { specName } = body
//     if (!specName) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Spec name is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Check if spec with same name already exists (only non-deleted)
//     const { data: existingSpec, error: checkError } = await supabase
//       .from('specs')
//       .select('specId')
//       .eq('specName', specName)
//       .is('deletedAt', null)
//       .maybeSingle()

//     if (checkError) {
//       console.error('Error checking existing spec:', checkError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check existing spec',
//           error: checkError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (existingSpec) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 409,
//           message: 'Spec with this name already exists',
//           timestamp: new Date().toISOString()
//         },
//         { status: 409 }
//       )
//     }

//     // Prepare spec data with logged-in employee ID
//     const currentTimestamp = new Date().toISOString();
//     const specData = {
//       specName,
//       createdAt: currentTimestamp,
//       createdBy: loggedInEmployeeId, // Using logged-in employee ID
//       updatedAt: currentTimestamp,
//       updatedBy: loggedInEmployeeId  // Using logged-in employee ID
//     }
    
//     const { data: spec, error } = await supabase
//       .from('specs')
//       .insert([specData])
//       .select(`
//         specId,
//         specName,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy
//       `)
//       .single()

//     if (error) {
//       console.error('Error creating spec:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to create spec',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     // Transform response
//     const transformedSpec = {
//       specId: spec.specId,
//       specName: spec.specName,
//       createdAt: spec.createdAt,
//       updatedAt: spec.updatedAt
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 201,
//         message: 'Spec created successfully',
//         timestamp: new Date().toISOString(),
//         data: transformedSpec
//       },
//       { status: 201 }
//     )

//   } catch (error) {
//     console.error('Specs POST error:', error)
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


// // PUT - Update spec
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
//     const { specId, ...updateData } = body
    
//     if (!specId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Spec ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Check if spec exists and is not deleted
//     const { data: existingSpecCheck, error: existsError } = await supabase
//       .from('specs')
//       .select('specId')
//       .eq('specId', specId)
//       .is('deletedAt', null)
//       .maybeSingle()

//     if (existsError) {
//       console.error('Error checking spec existence:', existsError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check spec existence',
//           error: existsError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (!existingSpecCheck) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Spec not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     // Check if spec name already exists (excluding current spec and deleted ones)
//     if (updateData.specName) {
//       const { data: duplicateSpec } = await supabase
//         .from('specs')
//         .select('specId')
//         .eq('specName', updateData.specName)
//         .neq('specId', specId)
//         .is('deletedAt', null)
//         .maybeSingle()

//       if (duplicateSpec) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 409,
//             message: 'Spec with this name already exists',
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
//       updatedBy: loggedInEmployeeId // Using logged-in employee ID
//     }
    
//     const { data: spec, error } = await supabase
//       .from('specs')
//       .update(updateDataWithTimestamp)
//       .eq('specId', specId)
//       .select(`
//         specId,
//         specName,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy
//       `)
//       .single()

//     if (error) {
//       console.error('Error updating spec:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to update spec',
//           timestamp: new Date().toISOString(),
//           details: error.message
//         },
//         { status: 500 }
//       )
//     }

//     if (!spec) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Spec not found after update',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     // Transform response
//     const transformedSpec = {
//       specId: spec.specId,
//       specName: spec.specName,
//       createdAt: spec.createdAt,
//       updatedAt: spec.updatedAt
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Spec updated successfully',
//         timestamp: new Date().toISOString(),
//         data: transformedSpec
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Specs PUT error:', error)
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



// // DELETE - Delete spec (soft delete)
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
//     const specId = searchParams.get('specId') || searchParams.get('id')

//     if (!specId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Spec ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     const supabase = createServerClient()

//     // Check if spec exists and is not already deleted
//     const { data: existingSpec, error: fetchError } = await supabase
//       .from('specs')
//       .select('specId')
//       .eq('specId', specId)
//       .is('deletedAt', null)
//       .maybeSingle()

//     if (fetchError) {
//       console.error('Error checking existing spec:', fetchError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check spec existence',
//           error: fetchError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (!existingSpec) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Spec not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }
    
//     // Soft delete the spec with logged-in employee ID
//     const { error } = await supabase
//       .from('specs')
//       .update({
//         deletedAt: new Date().toISOString(),
//         deletedBy: loggedInEmployeeId // Using logged-in employee ID
//       })
//       .eq('specId', specId)

//     if (error) {
//       console.error('Error deleting spec:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to delete spec',
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
//         message: 'Spec deleted successfully',
//         timestamp: new Date().toISOString()
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Specs DELETE error:', error)
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

interface Spec {
  specId: number
  specName: string
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

/**
 * @swagger
 * /api/spec:
 *   get:
 *     tags:
 *       - Specifications
 *     summary: Get all specifications
 *     description: Retrieve all specifications with pagination, sorting, and search
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
 *           default: specName
 *           enum: [specName, specId, createdAt]
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
 *         description: Search term for specification name
 *     responses:
 *       200:
 *         description: Specifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// GET - Retrieve specs with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Spec GET request started');
  
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
    const sortBy = searchParams.get('sortBy') || 'specName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only get non-deleted specs
    }

    // Apply search filter
    if (search) {
      where.specName = { contains: search, mode: 'insensitive' }
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['specName', 'specId', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'specName'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {
      console.log('🔌 Testing database connection...');
      await prisma.$connect();
      console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.specs.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get specs with pagination
      console.log(' Fetching specs...');
      const specs: Spec[] = await prisma.specs.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          specId: true,
          specName: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      }) as Spec[];

      console.log(` Found ${specs.length} specs`);

      // Transform data to match response format
      const transformedSpecs = specs.map((spec: any) => ({
        specId: spec.specId,
        specName: spec.specName,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt
      }));

      console.log(' Specs transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Specs retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedSpecs,
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
            search: search || null
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
          message: 'Failed to retrieve specs - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Specs GET error:', error);
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

/**
 * @swagger
 * /api/spec:
 *   post:
 *     tags:
 *       - Specifications
 *     summary: Create a new specification
 *     description: Create a new specification in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specName
 *             properties:
 *               specName:
 *                 type: string
 *                 description: Specification name
 *                 example: "RAM"
 *     responses:
 *       201:
 *         description: Specification created successfully
 *       400:
 *         description: Bad request - Missing specification name
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Specification name already exists
 *       500:
 *         description: Internal server error
 */

// POST - Create new spec
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
    const { specName } = body
    
    console.log(' Received data:', { specName });
    console.log(' Employee ID from token:', employeeId);

    if (!specName) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Spec name is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if spec with same name already exists (only non-deleted)
      const existingSpec = await prisma.specs.findFirst({
        where: {
          specName,
          deletedAt: null
        }
      })

      if (existingSpec) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'Spec with this name already exists',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }

      // Create new spec
      const spec = await prisma.specs.create({
        data: {
          specName,
          createdBy: employeeId,
          updatedBy: employeeId
        },
        select: {
          specId: true,
          specName: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      console.log(' Spec created:', spec);

      // Transform response
      const transformedSpec = {
        specId: spec.specId,
        specName: spec.specName,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'Spec created successfully',
          timestamp: new Date().toISOString(),
          data: transformedSpec
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create spec',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Specs POST error:', error)
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
 * /api/spec:
 *   put:
 *     tags:
 *       - Specifications
 *     summary: Update a specification
 *     description: Update an existing specification in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specId
 *             properties:
 *               specId:
 *                 type: integer
 *                 description: Specification ID to update
 *                 example: 1
 *               specName:
 *                 type: string
 *                 description: Specification name
 *                 example: "Memory (RAM)"
 *     responses:
 *       200:
 *         description: Specification updated successfully
 *       400:
 *         description: Bad request - Missing specification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Specification not found
 *       409:
 *         description: Specification name already exists
 *       500:
 *         description: Internal server error
 */

// PUT - Update spec
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
    const { specId, ...updateData } = body

    console.log(' Update - Employee ID from token:', employeeId);
    
    if (!specId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Spec ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if spec exists and is not deleted
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
            code: 404,
            message: 'Spec not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if spec name already exists (excluding current spec and deleted ones)
      if (updateData.specName) {
        const duplicateSpec = await prisma.specs.findFirst({
          where: {
            specName: updateData.specName,
            specId: { not: parseInt(specId) },
            deletedAt: null
          }
        })

        if (duplicateSpec) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'Spec with this name already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // Prepare update data
      const prismaUpdateData: any = {
        updatedBy: employeeId
      }

      if (updateData.specName !== undefined) prismaUpdateData.specName = updateData.specName

      console.log(' Update data:', prismaUpdateData);

      // Update spec
      const spec = await prisma.specs.update({
        where: {
          specId: parseInt(specId)
        },
        data: prismaUpdateData,
        select: {
          specId: true,
          specName: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      // Transform response
      const transformedSpec = {
        specId: spec.specId,
        specName: spec.specName,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Spec updated successfully',
          timestamp: new Date().toISOString(),
          data: transformedSpec
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update spec',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Specs PUT error:', error)
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
 * /api/spec:
 *   delete:
 *     tags:
 *       - Specifications
 *     summary: Delete a specification
 *     description: Soft delete a specification from the system
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: specId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Specification ID to delete
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative specification ID parameter
 *     responses:
 *       200:
 *         description: Specification deleted successfully
 *       400:
 *         description: Bad request - Missing specification ID or spec in use
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Specification not found
 *       500:
 *         description: Internal server error
 */

// DELETE - Delete spec (soft delete)
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
    const specId = searchParams.get('specId') || searchParams.get('id')

    if (!specId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Spec ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if spec exists and is not already deleted
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
            code: 404,
            message: 'Spec not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if spec is being used by any spec details
      const specDetailsUsingSpec = await prisma.specdetails.findFirst({
        where: {
          specId: parseInt(specId),
          deletedAt: null
        }
      })

      if (specDetailsUsingSpec) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Cannot delete specification that is being used by spec details',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Soft delete the spec
      await prisma.specs.update({
        where: {
          specId: parseInt(specId)
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
          message: 'Spec deleted successfully',
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
          message: 'Failed to delete spec',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Specs DELETE error:', error)
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
