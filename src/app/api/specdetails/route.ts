import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedSession } from '@/lib/api-auth-optimized'

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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// GET - Retrieve spec details with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' SpecDetail GET request started');

  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }

    console.log(' Access token verified');

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
      // console.log(' Testing database connection...');
      // await prisma.$connect();
      // console.log(' Database connected successfully');

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
  }
}

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
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Specification detail with this variation and spec already exists
 *       500:
 *         description: Internal server error
 */

// POST - Create new spec detail
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }

    const parsedEmployeeId = authResult.employeeId

    const body = await request.json()

    // Validate required fields
    const { variationId, specId, specValue } = body

    console.log(' Received data:', { variationId, specId, specValue });
    console.log(' Employee ID from session:', parsedEmployeeId);

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
          createdBy: parsedEmployeeId,
          updatedBy: parsedEmployeeId
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
 *       400:
 *         description: Bad request - Missing specification detail ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Specification detail not found
 *       409:
 *         description: Specification detail with this variation and spec already exists
 *       500:
 *         description: Internal server error
 */

// PUT - Update spec detail
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }

    const parsedEmployeeId = authResult.employeeId

    const body = await request.json()
    const { specDetailId, ...updateData } = body

    console.log(' Update - Employee ID from session:', parsedEmployeeId);

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
        updatedBy: parsedEmployeeId
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
 *       400:
 *         description: Bad request - Missing specification detail ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Specification detail not found
 *       500:
 *         description: Internal server error
 */

// DELETE - Delete spec detail (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }

    const parsedEmployeeId = authResult.employeeId



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
        // ... existing code ...
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
          deletedBy: parsedEmployeeId
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