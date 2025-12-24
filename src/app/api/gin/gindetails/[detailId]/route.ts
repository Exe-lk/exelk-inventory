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
 * /api/gin/details/{detailId}:
 *   get:
 *     tags:
 *       - GIN Details
 *     summary: Get GIN detail by ID
 *     description: Retrieve a specific GIN detail by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: integer
 *         description: GIN Detail ID
 *     responses:
 *       200:
 *         description: GIN detail retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GIN detail not found
 *       500:
 *         description: Internal server error
 */

// GET - Get single GIN detail by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ detailId: string }> }
) {
  try {
    const resolvedParams = await params;

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

    const detailId = parseInt(resolvedParams.detailId)

    if (isNaN(detailId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid GIN detail ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Get GIN detail by ID
      const ginDetail = await prisma.gindetails.findUnique({
        where: {
          ginDetailId: detailId
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

      if (!ginDetail) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GIN detail not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

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
          code: 200,
          message: 'GIN detail retrieved successfully',
          timestamp: new Date().toISOString(),
          data: transformedDetail
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve GIN detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GIN Detail GET error:', error)
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
 * /api/gin/details/{detailId}:
 *   put:
 *     tags:
 *       - GIN Details
 *     summary: Update GIN detail
 *     description: Update a specific GIN detail
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: integer
 *         description: GIN Detail ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               quantityIssued:
 *                 type: integer
 *               unitCost:
 *                 type: number
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: GIN detail updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GIN detail not found
 *       500:
 *         description: Internal server error
 */

// PUT - Update GIN detail
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ detailId: string }> }
) {
  try {
    const resolvedParams = await params;

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

    const detailId = parseInt(resolvedParams.detailId)
    const body = await request.json()

    if (isNaN(detailId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid GIN detail ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if GIN detail exists
      const existingDetail = await prisma.gindetails.findUnique({
        where: {
          ginDetailId: detailId
        }
      })

      if (!existingDetail) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GIN detail not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if product exists (if being updated)
      if (body.productId) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            productId: parseInt(body.productId),
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
      }

      // Prepare update data
      const updateData: any = {}

      if (body.productId !== undefined) updateData.productId = parseInt(body.productId)
      if (body.quantityIssued !== undefined) updateData.quantityIssued = parseInt(body.quantityIssued)
      if (body.unitCost !== undefined) updateData.unitCost = parseFloat(body.unitCost.toString())
      if (body.location !== undefined) updateData.location = body.location || null

      // Recalculate subtotal if quantity or unit cost changed
      if (body.quantityIssued !== undefined || body.unitCost !== undefined) {
        const qty = body.quantityIssued !== undefined ? parseInt(body.quantityIssued) : (existingDetail.quantityIssued || 0)
        const cost = body.unitCost !== undefined ? parseFloat(body.unitCost.toString()) : (existingDetail.unitCost ? parseFloat(existingDetail.unitCost.toString()) : 0)
        updateData.subTotal = qty * cost
      }

      // Update GIN detail
      const ginDetail = await prisma.gindetails.update({
        where: {
          ginDetailId: detailId
        },
        data: updateData,
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
          code: 200,
          message: 'GIN detail updated successfully',
          timestamp: new Date().toISOString(),
          data: transformedDetail
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update GIN detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GIN Detail PUT error:', error)
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
 * /api/gin/details/{detailId}:
 *   delete:
 *     tags:
 *       - GIN Details
 *     summary: Delete GIN detail
 *     description: Delete a specific GIN detail
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: integer
 *         description: GIN Detail ID
 *     responses:
 *       200:
 *         description: GIN detail deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GIN detail not found
 *       500:
 *         description: Internal server error
 */

// DELETE - Delete GIN detail
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ detailId: string }> }
) {
  try {
    const resolvedParams = await params;

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

    const detailId = parseInt(resolvedParams.detailId)

    if (isNaN(detailId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid GIN detail ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if GIN detail exists
      const existingDetail = await prisma.gindetails.findUnique({
        where: {
          ginDetailId: detailId
        }
      })

      if (!existingDetail) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GIN detail not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Delete GIN detail
      await prisma.gindetails.delete({
        where: {
          ginDetailId: detailId
        }
      })

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GIN detail deleted successfully',
          timestamp: new Date().toISOString(),
          data: null
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete GIN detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GIN Detail DELETE error:', error)
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