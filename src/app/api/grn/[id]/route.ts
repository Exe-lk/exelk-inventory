import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'

/**
 * @swagger
 * /api/grn/{id}:
 *   get:
 *     tags:
 *       - GRN
 *     summary: Get GRN by ID
 *     description: Retrieve a specific GRN record by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: GRN ID
 *     responses:
 *       200:
 *         description: GRN retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN not found
 *       500:
 *         description: Internal server error
 */

// GET - Get single GRN by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

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

    const grnId = parseInt(resolvedParams.id)

    if (isNaN(grnId)) {
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

    try {
      // Get GRN by ID
      const grn = await prisma.grn.findUnique({
        where: {
          grnId: grnId
        },
        select: {
          grnId: true,
          grnNumber: true,
          supplierId: true,
          employeeId: true,
          receivedDate: true,
          totalAmount: true,
          remarks: true,
          createdDate: true,
          updatedDate: true,
          stockId: true,
        }
      })

      if (!grn) {
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

      // Transform response
      const transformedGrn = {
        grnId: grn.grnId,
        grnNumber: grn.grnNumber,
        supplierId: grn.supplierId,
        stockKeeperId: grn.employeeId,
        receivedDate: grn.receivedDate?.toISOString().split('T')[0],
        totalAmount: grn.totalAmount ? parseFloat(grn.totalAmount.toString()) : 0,
        remarks: grn.remarks
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GRN retrieved successfully',
          timestamp: new Date().toISOString(),
          data: transformedGrn
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve GRN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN GET error:', error)
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
 * /api/grn/{id}:
 *   put:
 *     tags:
 *       - GRN
 *     summary: Update GRN
 *     description: Update a specific GRN record
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: GRN ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grnNumber:
 *                 type: string
 *               supplierId:
 *                 type: integer
 *               receivedDate:
 *                 type: string
 *                 format: date
 *               totalAmount:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: GRN updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN not found
 *       409:
 *         description: GRN number already exists
 *       500:
 *         description: Internal server error
 */

// PUT - Update GRN
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
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

    const grnId = parseInt(resolvedParams.id)
    const body = await request.json()

    if (isNaN(grnId)) {
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

    try {
      // Check if GRN exists
      const existingGrn = await prisma.grn.findUnique({
        where: {
          grnId: grnId
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

      // Check if GRN number already exists (excluding current GRN)
      if (body.grnNumber && body.grnNumber !== existingGrn.grnNumber) {
        const duplicateGrn = await prisma.grn.findFirst({
          where: {
            grnNumber: body.grnNumber,
            grnId: { not: grnId }
          }
        })

        if (duplicateGrn) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'GRN number already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // Check if supplier exists (if being updated)
      if (body.supplierId) {
        const existingSupplier = await prisma.supplier.findFirst({
          where: {
            supplierId: parseInt(body.supplierId),
            deletedAt: null
          }
        })

        if (!existingSupplier) {
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
      }

      // Prepare update data
      const updateData: any = {
        updatedDate: new Date()
      }

      if (body.grnNumber !== undefined) updateData.grnNumber = body.grnNumber
      if (body.supplierId !== undefined) updateData.supplierId = parseInt(body.supplierId)
      if (body.receivedDate !== undefined) updateData.receivedDate = new Date(body.receivedDate)
      if (body.totalAmount !== undefined) updateData.totalAmount = parseFloat(body.totalAmount.toString())
      if (body.remarks !== undefined) updateData.remarks = body.remarks

      // Update GRN
      const grn = await prisma.grn.update({
        where: {
          grnId: grnId
        },
        data: updateData,
        select: {
          grnId: true,
          grnNumber: true,
          supplierId: true,
          employeeId: true,
          receivedDate: true,
          totalAmount: true,
          remarks: true,
          createdDate: true,
          updatedDate: true,
          stockId: true,
        }
      })

      // Transform response
      const transformedGrn = {
        grnId: grn.grnId,
        grnNumber: grn.grnNumber,
        supplierId: grn.supplierId,
        stockKeeperId: grn.employeeId,
        receivedDate: grn.receivedDate?.toISOString().split('T')[0],
        totalAmount: grn.totalAmount ? parseFloat(grn.totalAmount.toString()) : 0,
        remarks: grn.remarks
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GRN updated successfully',
          timestamp: new Date().toISOString(),
          data: transformedGrn
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update GRN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN PUT error:', error)
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
 * /api/grn/{id}:
 *   delete:
 *     tags:
 *       - GRN
 *     summary: Delete GRN
 *     description: Delete a specific GRN record
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: GRN ID
 *     responses:
 *       200:
 *         description: GRN deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN not found
 *       500:
 *         description: Internal server error
 */

// DELETE - Delete GRN
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
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

    const grnId = parseInt(resolvedParams.id)

    if (isNaN(grnId)) {
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

    try {
      // Check if GRN exists
      const existingGrn = await prisma.grn.findUnique({
        where: {
          grnId: grnId
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

      // Delete GRN and related details
      await prisma.$transaction(async (tx) => {
        // Delete related GRN details first
        await tx.grndetails.deleteMany({
          where: {
            grnId: grnId
          }
        })

        // Delete the GRN
        await tx.grn.delete({
          where: {
            grnId: grnId
          }
        })
      })

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GRN deleted successfully',
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
          message: 'Failed to delete GRN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN DELETE error:', error)
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