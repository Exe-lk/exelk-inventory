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
 * /api/grn/details/{detailId}:
 *   get:
 *     tags:
 *       - GRN Details
 *     summary: Get GRN detail by ID
 *     description: Retrieve a specific GRN detail by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: integer
 *         description: GRN Detail ID
 *     responses:
 *       200:
 *         description: GRN detail retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN detail not found
 *       500:
 *         description: Internal server error
 */

// GET - Get single GRN detail by ID
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
          message: 'Invalid GRN detail ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Get GRN detail by ID
      const grnDetail = await prisma.grndetails.findUnique({
        where: {
          grnDetailId: detailId
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

      if (!grnDetail) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GRN detail not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

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
          code: 200,
          message: 'GRN detail retrieved successfully',
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
          message: 'Failed to retrieve GRN detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN Detail GET error:', error)
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
 * /api/grn/details/{detailId}:
 *   put:
 *     tags:
 *       - GRN Details
 *     summary: Update GRN detail
 *     description: Update a specific GRN detail
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: integer
 *         description: GRN Detail ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               quantityReceived:
 *                 type: integer
 *               unitCost:
 *                 type: number
 *               location:
 *                 type: integer
 *     responses:
 *       200:
 *         description: GRN detail updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN detail not found
 *       500:
 *         description: Internal server error
 */

// PUT - Update GRN detail
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
          message: 'Invalid GRN detail ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if GRN detail exists
      const existingDetail = await prisma.grndetails.findUnique({
        where: {
          grnDetailId: detailId
        }
      })

      if (!existingDetail) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GRN detail not found',
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
      if (body.quantityReceived !== undefined) updateData.quantityReceived = parseInt(body.quantityReceived)
      if (body.unitCost !== undefined) updateData.unitCost = parseFloat(body.unitCost.toString())
      if (body.location !== undefined) updateData.location = body.location || null

      // Recalculate subtotal if quantity or unit cost changed
      if (body.quantityReceived !== undefined || body.unitCost !== undefined) {
        const qty = body.quantityReceived !== undefined ? parseInt(body.quantityReceived) : (existingDetail.quantityReceived || 0)
        const cost = body.unitCost !== undefined ? parseFloat(body.unitCost.toString()) : (existingDetail.unitCost ? parseFloat(existingDetail.unitCost.toString()) : 0)
        updateData.subTotal = qty * cost
      }

      // Update GRN detail
      const grnDetail = await prisma.grndetails.update({
        where: {
          grnDetailId: detailId
        },
        data: updateData,
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
          code: 200,
          message: 'GRN detail updated successfully',
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
          message: 'Failed to update GRN detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN Detail PUT error:', error)
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
 * /api/grn/details/{detailId}:
 *   delete:
 *     tags:
 *       - GRN Details
 *     summary: Delete GRN detail
 *     description: Delete a specific GRN detail
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: integer
 *         description: GRN Detail ID
 *     responses:
 *       200:
 *         description: GRN detail deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN detail not found
 *       500:
 *         description: Internal server error
 */

// DELETE - Delete GRN detail
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
          message: 'Invalid GRN detail ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if GRN detail exists
      const existingDetail = await prisma.grndetails.findUnique({
        where: {
          grnDetailId: detailId
        }
      })

      if (!existingDetail) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GRN detail not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Delete GRN detail
      await prisma.grndetails.delete({
        where: {
          grnDetailId: detailId
        }
      })

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GRN detail deleted successfully',
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
          message: 'Failed to delete GRN detail',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN Detail DELETE error:', error)
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