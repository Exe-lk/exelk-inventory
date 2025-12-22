import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

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
 * /api/gin/details:
 *   get:
 *     tags:
 *       - GIN Details
 *     summary: Get all GIN details or filter by GIN ID
 *     description: Retrieve all GIN details with optional filtering by GIN ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: ginId
 *         schema:
 *           type: integer
 *         description: Filter by GIN ID
 *     responses:
 *       200:
 *         description: GIN details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// GET - Get all GIN details or filter by GIN ID
export async function GET(request: NextRequest) {
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

    try {
      verifyAccessToken(accessToken)
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
    const ginId = searchParams.get('ginId')

    try {
      let where = {}
      
      // Filter by GIN ID if provided
      if (ginId) {
        const parsedGinId = parseInt(ginId)
        if (isNaN(parsedGinId)) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Invalid GIN ID',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        // Check if GIN exists
        const existingGin = await prisma.gin.findUnique({
          where: {
            ginId: parsedGinId
          }
        })

        if (!existingGin) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 404,
              message: 'GIN not found',
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          )
        }

        where = { ginId: parsedGinId }
      }

      // Get GIN details
      const ginDetails = await prisma.gindetails.findMany({
        where,
        select: {
          ginDetailId: true,
          ginId: true,
          productId: true,
          quantityIssued: true,
          unitCost: true,
          subTotal: true,
          location: true,
        },
        orderBy: {
          ginDetailId: 'asc'
        }
      })

      // Transform data
      const transformedDetails = ginDetails.map((detail: any) => ({
        ginDetailId: detail.ginDetailId,
        ginId: detail.ginId,
        productId: detail.productId,
        quantityIssued: detail.quantityIssued,
        unitCost: detail.unitCost ? parseFloat(detail.unitCost.toString()) : 0,
        subTotal: detail.subTotal ? parseFloat(detail.subTotal.toString()) : 0,
        location: detail.location
      }))

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GIN details retrieved successfully',
          timestamp: new Date().toISOString(),
          data: transformedDetails
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error('💥 Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve GIN details',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 GIN Details GET error:', error)
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
 * /api/gin/details:
 *   post:
 *     tags:
 *       - GIN Details
 *     summary: Add individual GIN detail
 *     description: Add a new detail to an existing GIN
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ginId
 *               - productId
 *               - quantityIssued
 *               - unitCost
 *             properties:
 *               ginId:
 *                 type: integer
 *                 description: GIN ID
 *                 example: 1
 *               productId:
 *                 type: integer
 *                 description: Product ID
 *                 example: 1
 *               quantityIssued:
 *                 type: integer
 *                 description: Quantity issued
 *                 example: 5
 *               unitCost:
 *                 type: number
 *                 description: Unit cost
 *                 example: 299.99
 *               location:
 *                 type: string
 *                 description: Location
 *                 example: "WH1"
 *     responses:
 *       201:
 *         description: GIN detail added successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GIN or product not found
 *       500:
 *         description: Internal server error
 */

// POST - Add individual GIN detail
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

    try {
      verifyAccessToken(accessToken)
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
    const { ginId, productId, quantityIssued, unitCost, location } = body

    if (!ginId || !productId || !quantityIssued || !unitCost) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'GIN ID, product ID, quantity issued, and unit cost are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if GIN exists
      const existingGin = await prisma.gin.findUnique({
        where: {
          ginId: parseInt(ginId)
        }
      })

      if (!existingGin) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GIN not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
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

      // Calculate subtotal
      const qty = parseInt(quantityIssued)
      const cost = parseFloat(unitCost.toString())
      const subTotal = qty * cost

      // Create GIN detail
      const ginDetail = await prisma.gindetails.create({
        data: {
          ginId: parseInt(ginId),
          productId: parseInt(productId),
          quantityIssued: qty,
          unitCost: cost,
          subTotal: subTotal,
          location: location || null
        },
        select: {
          ginDetailId: true,
          ginId: true,
          productId: true,
          quantityIssued: true,
          unitCost: true,
          subTotal: true,
          location: true,
        }
      })

      // Transform response
      const transformedDetail = {
        ginDetailId: ginDetail.ginDetailId,
        ginId: ginDetail.ginId,
        productId: ginDetail.productId,
        quantityIssued: ginDetail.quantityIssued,
        unitCost: ginDetail.unitCost ? parseFloat(ginDetail.unitCost.toString()) : 0,
        subTotal: ginDetail.subTotal ? parseFloat(ginDetail.subTotal.toString()) : 0,
        location: ginDetail.location
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'GIN detail added successfully',
          timestamp: new Date().toISOString(),
          data: transformedDetail
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error('💥 Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to add GIN detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 GIN Details POST error:', error)
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