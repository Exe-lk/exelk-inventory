import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

interface Product {
  productId: number
  sku: string
  productName: string
  description: string | null
  categoryId: number
  brandId: number
  modelId: number
  supplierId: number
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

// GET - Retrieve products with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Product GET request started');
  
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
    const sortBy = searchParams.get('sortBy') || 'productId'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')
    const brandId = searchParams.get('brandId')
    const modelId = searchParams.get('modelId')
    const supplierId = searchParams.get('supplierId')
    const isActive = searchParams.get('isActive')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, categoryId, brandId, modelId, supplierId, isActive });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only get non-deleted products
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Apply filters
    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }

    if (brandId) {
      where.brandId = parseInt(brandId)
    }

    if (modelId) {
      where.modelId = parseInt(modelId)
    }

    if (supplierId) {
      where.supplierId = parseInt(supplierId)
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['productName', 'productId', 'sku', 'description', 'categoryId', 'brandId', 'modelId', 'supplierId', 'isActive', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'productName'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {
      console.log(' Testing database connection...');
      await prisma.$connect();
      console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.product.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get products with pagination
      console.log(' Fetching products...');
      const products: Product[] = await prisma.product.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          productId: true,
          sku: true,
          productName: true,
          description: true,
          categoryId: true,
          brandId: true,
          modelId: true,
          supplierId: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      }) as Product[];

      console.log(` Found ${products.length} products`);

      // Transform data to match response format
      const transformedProducts = products.map((product: any) => ({
        productId: product.productId,
        sku: product.sku,
        productName: product.productName,
        description: product.description,
        categoryId: product.categoryId,
        brandId: product.brandId,
        modelId: product.modelId,
        supplierId: product.supplierId,
        isActive: product.isActive,
        createdAt: product.createdAt,
        createdBy: product.createdBy || 1,
        updatedAt: product.updatedAt,
        updatedBy: product.updatedBy,
        deletedAt: product.deletedAt,
        deletedBy: product.deletedBy
      }));

      console.log(' Products transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Products retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedProducts,
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
          message: 'Failed to retrieve products - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Products GET error:', error);
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


// POST - Create simple product
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
    
    console.log(' Product POST received body:', JSON.stringify(body, null, 2));
    console.log(' Employee ID from token:', employeeId);
    
    const { 
      sku, 
      productName, 
      description, 
      categoryId, 
      brandId, 
      modelId, 
      supplierId, 
      isActive 
    } = body

    // Validate required fields
    if (!sku || !productName || !categoryId || !brandId || !modelId || !supplierId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'SKU, product name, categoryId, brandId, modelId, and supplierId are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if SKU already exists (only non-deleted products)
      const existingProduct = await prisma.product.findFirst({
        where: {
          sku,
          deletedAt: null
        }
      })

      if (existingProduct) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'SKU already exists',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }

      // Validate foreign key references
      const [category, brand, model, supplier] = await Promise.all([
        prisma.category.findFirst({ where: { categoryId: parseInt(categoryId), deletedAt: null } }),
        prisma.brand.findFirst({ where: { brandId: parseInt(brandId), deletedAt: null } }),
        prisma.model.findFirst({ where: { modelId: parseInt(modelId), deletedAt: null } }),
        prisma.supplier.findFirst({ where: { supplierId: parseInt(supplierId), deletedAt: null } })
      ])

      if (!category) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid category ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      if (!brand) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid brand ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      if (!model) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid model ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      if (!supplier) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid supplier ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Create new product
      const product = await prisma.product.create({
        data: {
          sku,
          productName,
          description: description || '',
          categoryId: parseInt(categoryId),
          brandId: parseInt(brandId),
          modelId: parseInt(modelId),
          supplierId: parseInt(supplierId),
          isActive: isActive !== undefined ? isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        },
        select: {
          productId: true,
          sku: true,
          productName: true,
          description: true,
          categoryId: true,
          brandId: true,
          modelId: true,
          supplierId: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      console.log(' Product created:', product);

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'Product created successfully',
          timestamp: new Date().toISOString(),
          data: product
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create product',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Products POST error:', error)
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


// PUT - Update product
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
    
    console.log(' Product PUT received body:', JSON.stringify(body, null, 2));
    console.log(' Employee ID from token:', employeeId);
    
    const { productId, ...updateData } = body
    
    if (!productId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Product ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if product exists and is not deleted
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
            code: 404,
            message: 'Product not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check for SKU conflicts if SKU is being updated
      if (updateData.sku && updateData.sku !== existingProduct.sku) {
        const duplicateProduct = await prisma.product.findFirst({
          where: {
            sku: updateData.sku,
            productId: { not: parseInt(productId) },
            deletedAt: null
          }
        })

        if (duplicateProduct) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'SKU already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // Validate foreign key references if being updated
      const validations = []
      
      if (updateData.categoryId) {
        validations.push(
          prisma.category.findFirst({ where: { categoryId: parseInt(updateData.categoryId), deletedAt: null } })
            .then(result => ({ type: 'category', exists: !!result }))
        )
      }
      
      if (updateData.brandId) {
        validations.push(
          prisma.brand.findFirst({ where: { brandId: parseInt(updateData.brandId), deletedAt: null } })
            .then(result => ({ type: 'brand', exists: !!result }))
        )
      }
      
      if (updateData.modelId) {
        validations.push(
          prisma.model.findFirst({ where: { modelId: parseInt(updateData.modelId), deletedAt: null } })
            .then(result => ({ type: 'model', exists: !!result }))
        )
      }
      
      if (updateData.supplierId) {
        validations.push(
          prisma.supplier.findFirst({ where: { supplierId: parseInt(updateData.supplierId), deletedAt: null } })
            .then(result => ({ type: 'supplier', exists: !!result }))
        )
      }

      if (validations.length > 0) {
        const validationResults = await Promise.all(validations)
        
        for (const result of validationResults) {
          if (!result.exists) {
            return NextResponse.json(
              { 
                status: 'error',
                code: 400,
                message: `Invalid ${result.type} ID`,
                timestamp: new Date().toISOString()
              },
              { status: 400 }
            )
          }
        }
      }

      // Prepare update data
      const prismaUpdateData: any = {
        updatedBy: employeeId
      }

      // Only include fields that are being updated
      if (updateData.sku !== undefined) prismaUpdateData.sku = updateData.sku
      if (updateData.productName !== undefined) prismaUpdateData.productName = updateData.productName
      if (updateData.description !== undefined) prismaUpdateData.description = updateData.description
      if (updateData.categoryId !== undefined) prismaUpdateData.categoryId = parseInt(updateData.categoryId)
      if (updateData.brandId !== undefined) prismaUpdateData.brandId = parseInt(updateData.brandId)
      if (updateData.modelId !== undefined) prismaUpdateData.modelId = parseInt(updateData.modelId)
      if (updateData.supplierId !== undefined) prismaUpdateData.supplierId = parseInt(updateData.supplierId)
      if (updateData.isActive !== undefined) prismaUpdateData.isActive = updateData.isActive

      console.log(' Update data:', prismaUpdateData);
      
      // Update product
      const product = await prisma.product.update({
        where: {
          productId: parseInt(productId)
        },
        data: prismaUpdateData,
        select: {
          productId: true,
          sku: true,
          productName: true,
          description: true,
          categoryId: true,
          brandId: true,
          modelId: true,
          supplierId: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      console.log(' Updated product:', product);

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Product updated successfully',
          timestamp: new Date().toISOString(),
          data: product
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update product',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Products PUT error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete product with cascade (soft delete)
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
    const productId = searchParams.get('productId') || searchParams.get('id')

    console.log(' Product DELETE received productId:', productId);

    if (!productId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Product ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if product exists and is not already deleted
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
            code: 404,
            message: 'Product not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      console.log(' Deleting product and related data:', existingProduct);

      const currentTimestamp = new Date()

      // Start cascade soft deletion process using transaction
      await prisma.$transaction(async (tx) => {
        // Step 1: Get all product versions for this product
        console.log(' Finding product versions...');
        const productVersions = await tx.productversion.findMany({
          where: {
            productId: parseInt(productId),
            deletedAt: null
          },
          select: { versionId: true }
        })

        console.log(' Found product versions:', productVersions);

        if (productVersions.length > 0) {
          const versionIds = productVersions.map((v: any) => v.versionId);

          // Step 2: Get all product variations for these versions
          console.log(' Finding product variations...');
          const productVariations = await tx.productvariation.findMany({
            where: {
              versionId: { in: versionIds },
              deletedAt: null
            },
            select: { variationId: true }
          })

          console.log(' Found product variations:', productVariations);

          if (productVariations.length > 0) {
            const variationIds = productVariations.map((v:any) => v.variationId);

            // Step 3: Soft delete spec details first (if they exist)
            console.log(' Soft deleting spec details...');
            await tx.specdetails.updateMany({
              where: {
                variationId: { in: variationIds },
                deletedAt: null
              },
              data: {
                deletedAt: currentTimestamp,
                deletedBy: employeeId
              }
            })

            console.log(' Soft deleted spec details for variations:', variationIds);

            // Step 4: Soft delete product variations
            console.log(' Soft deleting product variations...');
            await tx.productvariation.updateMany({
              where: {
                variationId: { in: variationIds },
                deletedAt: null
              },
              data: {
                deletedAt: currentTimestamp,
                deletedBy: employeeId,
                isActive: false
              }
            })

            console.log(' Soft deleted product variations:', variationIds);
          }

          // Step 5: Soft delete product versions
          console.log(' Soft deleting product versions...');
          await tx.productversion.updateMany({
            where: {
              versionId: { in: versionIds },
              deletedAt: null
            },
            data: {
              deletedAt: currentTimestamp,
              deletedBy: employeeId,
              isActive: false
            }
          })

          console.log(' Soft deleted product versions:', versionIds);
        }

        // Step 6: Finally soft delete the product
        console.log(' Soft deleting product...');
        await tx.product.update({
          where: {
            productId: parseInt(productId)
          },
          data: {
            deletedAt: currentTimestamp,
            deletedBy: employeeId,
            isActive: false
          }
        })

        console.log(' Successfully soft deleted product:', productId);
      })

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Product and all related data deleted successfully',
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error during cascade deletion:', dbError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete product and related data',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown error during cascade deletion'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Products DELETE error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}






/**
 * @swagger
 * /api/product:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products
 *     description: Retrieve all products with pagination, sorting, search, and filtering
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
 *           default: productName
 *           enum: [productName, productId, sku, description, categoryId, brandId, modelId, supplierId, isActive, createdAt]
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
 *         description: Search term for product name, description, or SKU
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: integer
 *         description: Filter by brand ID
 *       - in: query
 *         name: modelId
 *         schema:
 *           type: integer
 *         description: Filter by model ID
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: integer
 *         description: Filter by supplier ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                             $ref: '#/components/schemas/Product'
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
 * /api/product:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a new product
 *     description: Create a new basic product in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - productName
 *               - categoryId
 *               - brandId
 *               - modelId
 *               - supplierId
 *             properties:
 *               sku:
 *                 type: string
 *                 description: Stock Keeping Unit (unique identifier)
 *                 example: "LAP001"
 *               productName:
 *                 type: string
 *                 description: Product name
 *                 example: "MacBook Pro 16-inch"
 *               description:
 *                 type: string
 *                 description: Product description
 *                 example: "High-performance laptop for professionals"
 *               categoryId:
 *                 type: integer
 *                 description: Category ID
 *                 example: 1
 *               brandId:
 *                 type: integer
 *                 description: Brand ID
 *                 example: 1
 *               modelId:
 *                 type: integer
 *                 description: Model ID
 *                 example: 1
 *               supplierId:
 *                 type: integer
 *                 description: Supplier ID
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 description: Active status
 *                 default: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
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
 *         description: SKU already exists
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
 * /api/product:
 *   put:
 *     tags:
 *       - Products
 *     summary: Update a product
 *     description: Update an existing product in the system
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
 *                   - productId
 *                 properties:
 *                   productId:
 *                     type: integer
 *                     description: Product ID to update
 *                     example: 1
 *               - type: object
 *                 properties:
 *                   sku:
 *                     type: string
 *                     description: Stock Keeping Unit
 *                     example: "LAP001-V2"
 *                   productName:
 *                     type: string
 *                     description: Product name
 *                     example: "MacBook Pro 16-inch M2"
 *                   description:
 *                     type: string
 *                     description: Product description
 *                     example: "Latest generation high-performance laptop"
 *                   categoryId:
 *                     type: integer
 *                     description: Category ID
 *                     example: 1
 *                   brandId:
 *                     type: integer
 *                     description: Brand ID
 *                     example: 1
 *                   modelId:
 *                     type: integer
 *                     description: Model ID
 *                     example: 1
 *                   supplierId:
 *                     type: integer
 *                     description: Supplier ID
 *                     example: 1
 *                   isActive:
 *                     type: boolean
 *                     description: Active status
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request - Missing product ID
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: SKU already exists
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
 * /api/product:
 *   delete:
 *     tags:
 *       - Products
 *     summary: Delete a product
 *     description: Delete a product and all related data (versions, variations, specs) from the system
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Product ID to delete
 *         example: 1
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative product ID parameter
 *         example: 1
 *     responses:
 *       200:
 *         description: Product and all related data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - Missing product ID
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
 *         description: Product not found
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