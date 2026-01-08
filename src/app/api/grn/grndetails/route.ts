import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'

/**
 * @swagger
 * /api/grn/details:
 *   get:
 *     tags:
 *       - GRN Details
 *     summary: Get all GRN details or filter by GRN ID
 *     description: Retrieve all GRN details with optional filtering by GRN ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: grnId
 *         schema:
 *           type: integer
 *         description: Filter by GRN ID
 *     responses:
 *       200:
 *         description: GRN details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// GET - Get all GRN details or filter by GRN ID
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const grnId = searchParams.get('grnId')

    try {
      let where = {}
      
      // Filter by GRN ID if provided
      if (grnId) {
        const parsedGrnId = parseInt(grnId)
        if (isNaN(parsedGrnId)) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Invalid GRN ID',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        // Check if GRN exists
        const existingGrn = await prisma.grn.findUnique({
          where: {
            grnId: parsedGrnId
          }
        })

        if (!existingGrn) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 404,
              message: 'GRN not found',
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          )
        }

        where = { grnId: parsedGrnId }
      }

      // Get GRN details
      const grnDetails = await prisma.grndetails.findMany({
        where,
        select: {
          grnDetailId: true,
          grnId: true,
          productId: true,
          quantityReceived: true,
          unitCost: true,
          subTotal: true,
          location: true,
        },
        orderBy: {
          grnDetailId: 'asc'
        }
      })

      // Transform data
      const transformedDetails = grnDetails.map((detail: any) => ({
        grnDetailId: detail.grnDetailId,
        grnId: detail.grnId,
        productId: detail.productId,
        quantityReceived: detail.quantityReceived,
        unitCost: detail.unitCost ? parseFloat(detail.unitCost.toString()) : 0,
        subTotal: detail.subTotal ? parseFloat(detail.subTotal.toString()) : 0,
        location: detail.location
      }))

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GRN details retrieved successfully',
          timestamp: new Date().toISOString(),
          data: transformedDetails
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve GRN details',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN Details GET error:', error)
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
 * /api/grn/details:
 *   post:
 *     tags:
 *       - GRN Details
 *     summary: Add individual GRN detail
 *     description: Add a new detail to an existing GRN
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grnId
 *               - productId
 *               - quantityReceived
 *               - unitCost
 *             properties:
 *               grnId:
 *                 type: integer
 *                 description: GRN ID
 *                 example: 1
 *               productId:
 *                 type: integer
 *                 description: Product ID
 *                 example: 1
 *               quantityReceived:
 *                 type: integer
 *                 description: Quantity received
 *                 example: 10
 *               unitCost:
 *                 type: number
 *                 description: Unit cost
 *                 example: 299.99
 *               location:
 *                 type: integer
 *                 description: Location ID
 *                 example: 1
 *     responses:
 *       201:
 *         description: GRN detail added successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN or product not found
 *       500:
 *         description: Internal server error
 */

// POST - Add individual GRN detail
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

    const body = await request.json()

    // Validate required fields
    const { grnId, productId, quantityReceived, unitCost, location } = body

    if (!grnId || !productId || !quantityReceived || !unitCost) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'GRN ID, product ID, quantity received, and unit cost are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if GRN exists
      const existingGrn = await prisma.grn.findUnique({
        where: {
          grnId: parseInt(grnId)
        }
      })

      if (!existingGrn) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GRN not found',
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
      const qty = parseInt(quantityReceived)
      const cost = parseFloat(unitCost.toString())
      const subTotal = qty * cost

      // Create GRN detail
      const grnDetail = await prisma.grndetails.create({
        data: {
          grnId: parseInt(grnId),
          productId: parseInt(productId),
          quantityReceived: qty,
          unitCost: cost,
          subTotal: subTotal,
          location: location || null
        },
        select: {
          grnDetailId: true,
          grnId: true,
          productId: true,
          quantityReceived: true,
          unitCost: true,
          subTotal: true,
          location: true,
        }
      })

      // Transform response
      const transformedDetail = {
        grnDetailId: grnDetail.grnDetailId,
        grnId: grnDetail.grnId,
        productId: grnDetail.productId,
        quantityReceived: grnDetail.quantityReceived,
        unitCost: grnDetail.unitCost ? parseFloat(grnDetail.unitCost.toString()) : 0,
        subTotal: grnDetail.subTotal ? parseFloat(grnDetail.subTotal.toString()) : 0,
        location: grnDetail.location
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'GRN detail added successfully',
          timestamp: new Date().toISOString(),
          data: transformedDetail
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to add GRN detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN Details POST error:', error)
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