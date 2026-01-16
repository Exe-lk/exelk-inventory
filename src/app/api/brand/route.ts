import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedSession } from '@/lib/api-auth-optimized'

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

// GET - Retrieve brands with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Brand GET request started');

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

      // console.log(' Testing database connection...');
      // await prisma.$connect();
      // console.log(' Database connected successfully');

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
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }
    const employeeId = authResult.employeeId!

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
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }
    const employeeId = authResult.employeeId

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
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }
    const employeeId = authResult.employeeId

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
