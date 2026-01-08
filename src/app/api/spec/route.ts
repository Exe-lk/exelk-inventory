import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'

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
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
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

    console.log(' Access token verified');

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

    // Get employee ID from session
    const employeeId = session.user.user_metadata?.employee_id
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const parsedEmployeeId = parseInt(employeeId.toString())
    if (isNaN(parsedEmployeeId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid employee ID in token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const { specName } = body
    
    console.log(' Received data:', { specName });
    console.log(' Employee ID from token:', parsedEmployeeId);

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
          createdBy: parsedEmployeeId,
          updatedBy: parsedEmployeeId
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

    // Get employee ID from session
    const employeeId = session.user.user_metadata?.employee_id
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const parsedEmployeeId = parseInt(employeeId.toString())
    if (isNaN(parsedEmployeeId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid employee ID in token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { specId, ...updateData } = body

    console.log(' Update - Employee ID from token:', parsedEmployeeId);
    
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
        updatedBy: parsedEmployeeId
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

    // Get employee ID from session
    const employeeId = session.user.user_metadata?.employee_id
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const parsedEmployeeId = parseInt(employeeId.toString())
    if (isNaN(parsedEmployeeId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid employee ID in token',
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
          deletedBy: parsedEmployeeId
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