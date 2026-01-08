import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'

/**
 * @swagger
 * /api/stock/{id}:
 *   get:
 *     tags:
 *       - Stock
 *     summary: Get stock by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */

// GET - Get single stock by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(' Stock GET by ID request started');
  
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

    console.log(' Access token verified');

    const stockId = parseInt(resolvedParams.id)
    if (isNaN(stockId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid stock ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const stock = await prisma.stock.findUnique({
      where: { stockId },
      include: {
        product: {
          select: {
            productName: true,
            sku: true,
            brand: {
              select: {
                brandName: true
              }
            },
            category: {
              select: {
                categoryName: true
              }
            }
          }
        },
        productvariation: {
          select: {
            variationName: true,
            color: true,
            size: true,
            capacity: true
          }
        }
      }
    })

    if (!stock) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Stock not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    const transformedStock = {
      stockId: stock.stockId,
      productId: stock.productId,
      variationId: stock.variationId,
      quantityAvailable: stock.quantityAvailable || 0,
      reorderLevel: stock.reorderLevel || 0,
      lastUpdatedDate: stock.lastUpdatedDate?.toISOString(),
      location: stock.location,
      // Include related data
      productName: stock.product?.productName,
      productSku: stock.product?.sku,
      brandName: stock.product?.brand?.brandName,
      categoryName: stock.product?.category?.categoryName,
      variationName: stock.productvariation?.variationName,
      variationColor: stock.productvariation?.color,
      variationSize: stock.productvariation?.size,
      variationCapacity: stock.productvariation?.capacity
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Stock retrieved successfully',
        timestamp: new Date().toISOString(),
        data: transformedStock
      },
      { status: 200 }
    )

  } catch (error) {
    console.error(' Stock GET by ID error:', error)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(' Stock PUT request started');
  
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

    console.log(' Access token verified, employee ID:', parsedEmployeeId);

    const stockId = parseInt(resolvedParams.id)
    if (isNaN(stockId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid stock ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Check if stock exists
    const existingStock = await prisma.stock.findUnique({
      where: { stockId }
    })

    if (!existingStock) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Stock not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      lastUpdatedDate: new Date()
    }

    if (body.productId !== undefined) updateData.productId = body.productId
    if (body.variationId !== undefined) updateData.variationId = body.variationId
    if (body.quantityAvailable !== undefined) updateData.quantityAvailable = body.quantityAvailable
    if (body.reorderLevel !== undefined) updateData.reorderLevel = body.reorderLevel
    if (body.location !== undefined) updateData.location = body.location

    const result = await prisma.$transaction(async (tx) => {
      // Update stock
      const stock = await tx.stock.update({
        where: { stockId },
        data: updateData,
        include: {
          product: {
            select: {
              productName: true,
              sku: true,
              brand: {
                select: {
                  brandName: true
                }
              },
              category: {
                select: {
                  categoryName: true
                }
              }
            }
          },
          productvariation: {
            select: {
              variationName: true,
              color: true,
              size: true,
              capacity: true
            }
          }
        }
      })

      // Create transaction log for stock update
      await tx.transactionlog.create({
        data: {
          employeeId: parsedEmployeeId,
          actionType: 'UPDATE',
          entityName: 'STOCK',
          referenceId: stockId,
          actionDate: new Date(),
          oldValue: JSON.stringify({
            stockId: existingStock.stockId,
            productId: existingStock.productId,
            variationId: existingStock.variationId,
            quantityAvailable: existingStock.quantityAvailable,
            reorderLevel: existingStock.reorderLevel,
            location: existingStock.location
          }),
          newValue: JSON.stringify({
            stockId: stock.stockId,
            productId: stock.productId,
            variationId: stock.variationId,
            quantityAvailable: stock.quantityAvailable,
            reorderLevel: stock.reorderLevel,
            location: stock.location
          })
        }
      })

      return stock
    })

    const transformedStock = {
      stockId: result.stockId,
      productId: result.productId,
      variationId: result.variationId,
      quantityAvailable: result.quantityAvailable || 0,
      reorderLevel: result.reorderLevel || 0,
      lastUpdatedDate: result.lastUpdatedDate?.toISOString(),
      location: result.location,
      // Include related data
      productName: result.product?.productName,
      productSku: result.product?.sku,
      brandName: result.product?.brand?.brandName,
      categoryName: result.product?.category?.categoryName,
      variationName: result.productvariation?.variationName,
      variationColor: result.productvariation?.color,
      variationSize: result.productvariation?.size,
      variationCapacity: result.productvariation?.capacity
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Stock updated successfully',
        timestamp: new Date().toISOString(),
        data: transformedStock
      },
      { status: 200 }
    )

  } catch (error) {
    console.error(' Stock PUT error:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(' Stock DELETE request started');
  
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

    console.log(' Access token verified, employee ID:', parsedEmployeeId);

    const stockId = parseInt(resolvedParams.id)
    if (isNaN(stockId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid stock ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check if stock exists
    const existingStock = await prisma.stock.findUnique({
      where: { stockId }
    })

    if (!existingStock) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Stock not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Create transaction log before deletion
      await tx.transactionlog.create({
        data: {
          employeeId: parsedEmployeeId,
          actionType: 'DELETE',
          entityName: 'STOCK',
          referenceId: stockId,
          actionDate: new Date(),
          oldValue: JSON.stringify({
            stockId: existingStock.stockId,
            productId: existingStock.productId,
            variationId: existingStock.variationId,
            quantityAvailable: existingStock.quantityAvailable,
            reorderLevel: existingStock.reorderLevel,
            location: existingStock.location
          }),
          newValue: JSON.stringify({ deleted: true })
        }
      })

      // Delete stock
      await tx.stock.delete({
        where: { stockId }
      })
    })

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Stock deleted successfully',
        timestamp: new Date().toISOString(),
        data: null
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(' Stock DELETE error:', error)
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