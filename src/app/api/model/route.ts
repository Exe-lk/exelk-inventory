

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedSession } from '@/lib/api-auth-optimized'

interface Model {
  modelId: number
  modelName: string
  description: string | null
  brandId: number
  isActive: boolean
  createdAt: Date
  createdBy: number
  updatedAt: Date
  updatedBy: number
  deletedAt: Date | null
  deletedBy: number | null
}

// Helper function to extract employee ID from Supabase session


// GET - Retrieve models with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Model GET request started');
  
  try {
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
    const sortBy = searchParams.get('sortBy') || 'modelId'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId')
    const isActive = searchParams.get('isActive')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, brandId, isActive });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only get non-deleted models
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { modelName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Apply filters
    if (brandId) {
      where.brandId = parseInt(brandId)
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['modelName', 'modelId', 'description', 'brandId', 'isActive', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'modelName'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log('Order by:', orderBy);

    try {
      // console.log('🔌 Testing database connection...');
      // await prisma.$connect();
      // console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.model.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get models with pagination
      console.log(' Fetching models...');
      const models: Model[] = await prisma.model.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          modelId: true,
          modelName: true,
          description: true,
          brandId: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      }) as Model[];

      console.log(` Found ${models.length} models`);

      // Transform data to match response format
      const transformedModels = models.map((model: any) => ({
        modelID: model.modelId,
        modelName: model.modelName,
        description: model.description,
        brandID: model.brandId,
        isActive: model.isActive,
        createdAt: model.createdAt,
        createdBy: model.createdBy || 1,
        updatedAt: model.updatedAt,
        updatedBy: model.updatedBy,
        deletedAt: model.deletedAt,
        deletedBy: model.deletedBy
      }));

      console.log(' Models transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Models retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedModels,
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
          message: 'Failed to retrieve models - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Models GET error:', error);
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

// POST - Create new model
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }
    const employeeId = authResult.employeeId!

    const body = await request.json()
    
    // Validate required fields
    const { modelName, description, brandID, isActive } = body
    
    if (!modelName) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Model name is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    if (!brandID) {
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
          brandId: parseInt(brandID),
          deletedAt: null
        }
      })

      if (!existingBrand) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid Brand ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Check if model name already exists for the same brand
      const existingModel = await prisma.model.findFirst({
        where: {
          modelName,
          brandId: parseInt(brandID),
          deletedAt: null
        }
      })

      if (existingModel) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'Model name already exists for this brand',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }

      // Create new model
      const model = await prisma.model.create({
        data: {
          modelName,
          description: description || '',
          brandId: parseInt(brandID),
          isActive: isActive !== undefined ? isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        },
        select: {
          modelId: true,
          modelName: true,
          description: true,
          brandId: true,
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
      const transformedModel = {
        modelID: model.modelId,
        modelName: model.modelName,
        description: model.description,
        brandID: model.brandId,
        isActive: model.isActive,
        createdAt: model.createdAt,
        createdBy: model.createdBy,
        updatedAt: model.updatedAt,
        updatedBy: model.updatedBy,
        deletedAt: model.deletedAt,
        deletedBy: model.deletedBy
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'Model created successfully',
          timestamp: new Date().toISOString(),
          data: transformedModel
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create model',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Models POST error:', error)
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

// PUT - Update model
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }
    const employeeId = authResult.employeeId

    const body = await request.json()
    const { modelID, ...updateData } = body
    
    if (!modelID) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Model ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if model exists
      const existingModel = await prisma.model.findFirst({
        where: {
          modelId: parseInt(modelID),
          deletedAt: null
        }
      })

      if (!existingModel) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Model not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // If brandID is being updated, check if it exists
      if (updateData.brandID) {
        const existingBrand = await prisma.brand.findFirst({
          where: {
            brandId: parseInt(updateData.brandID),
            deletedAt: null
          }
        })

        if (!existingBrand) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Invalid Brand ID',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
      }

      // Check if model name already exists for the brand (excluding current model)
      if (updateData.modelName || updateData.brandID) {
        const modelNameToCheck = updateData.modelName || existingModel.modelName
        const brandIdToCheck = updateData.brandID ? parseInt(updateData.brandID) : existingModel.brandId

        const duplicateModel = await prisma.model.findFirst({
          where: {
            modelName: modelNameToCheck,
            brandId: brandIdToCheck,
            modelId: { not: parseInt(modelID) },
            deletedAt: null
          }
        })

        if (duplicateModel) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'Model name already exists for this brand',
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

      if (updateData.modelName !== undefined) prismaUpdateData.modelName = updateData.modelName
      if (updateData.description !== undefined) prismaUpdateData.description = updateData.description
      if (updateData.brandID !== undefined) prismaUpdateData.brandId = parseInt(updateData.brandID)
      if (updateData.isActive !== undefined) prismaUpdateData.isActive = updateData.isActive

      // Update model
      const model = await prisma.model.update({
        where: {
          modelId: parseInt(modelID)
        },
        data: prismaUpdateData,
        select: {
          modelId: true,
          modelName: true,
          description: true,
          brandId: true,
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
      const transformedModel = {
        modelID: model.modelId,
        modelName: model.modelName,
        description: model.description,
        brandID: model.brandId,
        isActive: model.isActive,
        createdAt: model.createdAt,
        createdBy: model.createdBy,
        updatedAt: model.updatedAt,
        updatedBy: model.updatedBy,
        deletedAt: model.deletedAt,
        deletedBy: model.deletedBy
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Model updated successfully',
          timestamp: new Date().toISOString(),
          data: transformedModel
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update model',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Models PUT error:', error)
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

// DELETE - Delete model (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }
    const employeeId = authResult.employeeId

    const { searchParams } = new URL(request.url)
    const modelID = searchParams.get('modelID') || searchParams.get('id')

    if (!modelID) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Model ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if model exists
      const existingModel = await prisma.model.findFirst({
        where: {
          modelId: parseInt(modelID),
          deletedAt: null
        }
      })

      if (!existingModel) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Model not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if model is being used by any products
      const productsUsingModel = await prisma.product.findFirst({
        where: {
          modelId: parseInt(modelID),
          deletedAt: null
        }
      })

      if (productsUsingModel) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Cannot delete model that is being used by products',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Soft delete the model
      await prisma.model.update({
        where: {
          modelId: parseInt(modelID)
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
          message: 'Model deleted successfully',
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
          message: 'Failed to delete model',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Models DELETE error:', error)
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
 * /api/model:
 *   get:
 *     tags:
 *       - Models
 *     summary: Get all models
 *     description: Retrieve all models with pagination, sorting, search, and filtering
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
 *           default: modelName
 *           enum: [modelName, description, brandId, isActive, createdAt]
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
 *         description: Search term for model name or description
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: integer
 *         description: Filter by brand ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Models retrieved successfully
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
 *                             $ref: '#/components/schemas/Model'
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
 * /api/model:
 *   post:
 *     tags:
 *       - Models
 *     summary: Create a new model
 *     description: Create a new model in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateModelRequest'
 *     responses:
 *       201:
 *         description: Model created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Model'
 *       400:
 *         description: Bad request - Missing required fields or invalid brand ID
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
 *         description: Model name already exists for this brand
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
 * /api/model:
 *   put:
 *     tags:
 *       - Models
 *     summary: Update a model
 *     description: Update an existing model in the system
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
 *                   - modelID
 *                 properties:
 *                   modelID:
 *                     type: integer
 *                     description: Model ID to update
 *               - type: object
 *                 properties:
 *                   modelName:
 *                     type: string
 *                     description: Model name
 *                   description:
 *                     type: string
 *                     description: Model description
 *                   brandID:
 *                     type: integer
 *                     description: Brand ID
 *                   isActive:
 *                     type: boolean
 *                     description: Active status
 *     responses:
 *       200:
 *         description: Model updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Model'
 *       400:
 *         description: Bad request - Missing model ID or invalid brand ID
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
 *         description: Model not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: Model name already exists for this brand
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
 * /api/model:
 *   delete:
 *     tags:
 *       - Models
 *     summary: Delete a model
 *     description: Delete a model from the system (soft delete)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: modelID
 *         required: false
 *         schema:
 *           type: integer
 *         description: Model ID to delete
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative model ID parameter
 *     responses:
 *       200:
 *         description: Model deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - Missing model ID or model in use by products
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
 *         description: Model not found
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