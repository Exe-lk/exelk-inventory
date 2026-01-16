import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedSession } from '@/lib/api-auth-optimized'

// Generate return number
function generateReturnNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `RT-${year}${month}${day}-${timestamp}`;
}

/**
 * @swagger
 * /api/return:
 *   get:
 *     tags:
 *       - Returns
 *     summary: Get all returns
 *     description: Retrieve all return records with pagination, sorting, search, and filtering
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "returnDate"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: returnType
 *         schema:
 *           type: string
 *       - in: query
 *         name: returnStatus
 *         schema:
 *           type: string
 */

// GET - Retrieve returns with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Return GET request started');
  
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

console.log(' Access token verified');

    const { searchParams } = new URL(request.url)

    // Parse query parameters with defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')))
    const sortBy = searchParams.get('sortBy') || 'returnDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const supplierId = searchParams.get('supplierId')
    const returnType = searchParams.get('returnType')
    const returnStatus = searchParams.get('returnStatus')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, supplierId, returnType, returnStatus });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where conditions
    const where: any = {}

    // Apply filters
    if (supplierId) {
      where.supplierId = parseInt(supplierId)
    }

    if (returnType) {
      where.returnType = returnType
    }

    if (returnStatus) {
      where.returnStatus = returnStatus
    }

    // Search filter - search in reason, remarks, and related supplier data
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } },
        { returnType: { contains: search, mode: 'insensitive' } },
        { returnStatus: { contains: search, mode: 'insensitive' } },
        { 
          supplier: { 
            supplierName: { contains: search, mode: 'insensitive' } 
          } 
        }
      ]
    }

    // Valid sort columns
    const validSortColumns = ['returnId', 'returnDate', 'returnType', 'returnStatus', 'supplierId']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'returnDate'
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where conditions:', JSON.stringify(where, null, 2));
    console.log(' Sort by:', sortColumn, sortDirection);

    try {
      // Get returns with counts - include related data
      const [returns, totalCount] = await Promise.all([
        prisma.returns.findMany({
          where,
          orderBy: {
            [sortColumn]: sortDirection
          },
          skip: offset,
          take: limit,
          include: {
            supplier: {
              select: {
                supplierId: true,
                supplierName: true
              }
            },
            employees: {
              select: {
                EmployeeID: true,
                UserName: true
              }
            },
            returnproduct: {
              include: {
                productvariation: {
                  include: {
                    version: {
                      include: {
                        product: {
                          select: {
                            productId: true,
                            productName: true,
                            sku: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        prisma.returns.count({ where })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      console.log(` Found ${returns.length} returns out of ${totalCount} total`);

      // Transform data for response
      const transformedReturns = returns.map(returnItem => ({
        returnId: returnItem.returnId,
        returnNumber: `RT-${String(returnItem.returnId).padStart(6, '0')}`, // Generate return number from ID
        returnedBy: returnItem.employeeId,
        returnDate: returnItem.returnDate?.toISOString()?.split('T')[0] || null,
        reason: returnItem.reason,
        status: returnItem.returnStatus,
        remarks: returnItem.remarks,
        returnType: returnItem.returnType,
        approved: returnItem.approved,
        supplier: {
          supplierId: returnItem.supplier.supplierId,
          supplierName: returnItem.supplier.supplierName
        },
        employee: {
          employeeId: returnItem.employees.EmployeeID,
          userName: returnItem.employees.UserName
        },
        details: returnItem.returnproduct.map(rp => ({
          returnProductId: rp.returnProductId,
          productId: rp.productvariation.version.product.productId,
          productName: rp.productvariation.version.product.productName,
          productSku: rp.productvariation.version.product.sku,
          variationId: rp.variationId,
          variationName: rp.productvariation.variationName,
          quantityReturned: rp.quantity,
          remarks: rp.remarks
        }))
      }))

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Returns retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedReturns,
            pagination: {
              totalItems: totalCount,
              page,
              limit,
              totalPages
            },
            sorting: {
              sortBy: sortColumn,
              sortOrder: sortDirection
            },
            search: search || null,
            filters: {
              supplierId: supplierId ? parseInt(supplierId) : null,
              returnType: returnType || null,
              returnStatus: returnStatus || null
            }
          }
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve returns - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Return GET error:', error)
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
 * /api/return:
 *   post:
 *     tags:
 *       - Returns
 *     summary: Create return
 *     description: Create a new return with return products
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - returnDate
 *               - reason
 *               - details
 *             properties:
 *               supplierId:
 *                 type: integer
 *               returnType:
 *                 type: string
 *               returnDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *               remarks:
 *                 type: string
 *               returnStatus:
 *                 type: string
 *               approved:
 *                 type: boolean
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     variationId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     remarks:
 *                       type: string
 */

// POST - Create return
export async function POST(request: NextRequest) {
  console.log(' Return POST request started');
  
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

const parsedEmployeeId = authResult.employeeId!
console.log(' Access token verified, employee ID:', parsedEmployeeId);

    const body = await request.json()
    console.log(' Request body:', body);

    // Validation
    const { supplierId, returnType, returnDate, reason, remarks, returnStatus, approved, details } = body

    if (!supplierId || !returnDate || !reason || !details || !Array.isArray(details) || details.length === 0) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Missing required fields: supplierId, returnDate, reason, details',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Pre-validate data outside transaction
    console.log(' Pre-validating data before transaction...');
    
    // Validate supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { 
        supplierId: parseInt(supplierId),
        deletedAt: null
      }
    });

    if (!supplier) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: `Supplier with ID ${supplierId} not found`,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // OPTIMIZATION: Validate all details with batch query instead of N queries
    // First validate basic structure
    for (const detail of details) {
      if (!detail.variationId || !detail.quantity || detail.quantity <= 0) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Each detail must have variationId and quantity (> 0)',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Collect all variation IDs
    const variationIds = details
      .map(d => d.variationId)
      .filter((id): id is number => id !== undefined && id !== null);

    // Fetch all variations in ONE query instead of N queries
    const variations = await prisma.productvariation.findMany({
      where: {
        variationId: { in: variationIds }
      }
    });

    // Create a map for O(1) lookup
    const variationMap = new Map(
      variations.map(v => [v.variationId, v])
    );

    // Now validate using the map (no database queries in loop)
    for (const detail of details) {
      const variation = variationMap.get(detail.variationId);
      if (!variation) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: `Product variation with ID ${detail.variationId} not found`,
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }
    }

    console.log(' Pre-validation completed. Starting transaction...');

    const result = await prisma.$transaction(async (tx) => {
      // Create return
      const returnRecord = await tx.returns.create({
        data: {
          supplierId: parseInt(supplierId),
          employeeId: parsedEmployeeId,
          returnType: returnType || 'SUPPLIER_RETURN',
          returnDate: new Date(returnDate),
          reason,
          remarks: remarks || null,
          approved: approved || false,
          returnStatus: returnStatus || 'PENDING'
        }
      })

      console.log(` Created return: ${returnRecord.returnId}`);

      // OPTIMIZATION: Use createMany for batch insert instead of individual creates
      // However, createMany doesn't return created records, so we'll keep individual creates
      // if we need the IDs, or use createMany and fetch afterward
      // Since returnProducts array is populated but IDs aren't used after, we could optimize,
      // but to maintain existing behavior, keeping individual creates for now
      const returnProducts = []

      for (const detail of details) {
        console.log(` Processing return product: Variation ${detail.variationId}, Qty: ${detail.quantity}`);

        // Create return product
        const returnProduct = await tx.returnproduct.create({
          data: {
            returnId: returnRecord.returnId,
            variationId: detail.variationId,
            quantity: detail.quantity,
            remarks: detail.remarks || null
          }
        })
        returnProducts.push(returnProduct)
      }

      // Create main transaction log entry
      await tx.transactionlog.create({
        data: {
          employeeId: parsedEmployeeId,
          actionType: 'CREATE',
          entityName: 'RETURN',
          referenceId: returnRecord.returnId,
          actionDate: new Date(),
          oldValue: null,
          newValue: JSON.stringify({
            returnId: returnRecord.returnId,
            supplierId: parseInt(supplierId),
            returnType: returnType,
            returnDate: returnDate,
            reason: reason,
            returnStatus: returnStatus || 'PENDING',
            itemCount: details.length
          })
        }
      })

      return { returnRecord, returnProducts }
    })

    // Get the created return with full details for response
    const createdReturn = await prisma.returns.findUnique({
      where: { returnId: result.returnRecord.returnId },
      include: {
        supplier: {
          select: {
            supplierId: true,
            supplierName: true
          }
        },
        returnproduct: {
          include: {
            productvariation: {
              include: {
                version: {
                  include: {
                    product: {
                      select: {
                        productId: true,
                        productName: true,
                        sku: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Transform response
    const transformedReturn = {
      returnId: createdReturn!.returnId,
      returnNumber: `RT-${String(createdReturn!.returnId).padStart(6, '0')}`,
      returnedBy: createdReturn!.employeeId,
      returnDate: createdReturn!.returnDate?.toISOString()?.split('T')[0] || null,
      reason: createdReturn!.reason,
      status: createdReturn!.returnStatus,
      remarks: createdReturn!.remarks,
      returnType: createdReturn!.returnType,
      approved: createdReturn!.approved,
      details: createdReturn!.returnproduct.map(rp => ({
        returnProductId: rp.returnProductId,
        productId: rp.productvariation.version.product.productId,
        productName: rp.productvariation.version.product.productName,
        quantityReturned: rp.quantity,
        remarks: rp.remarks
      }))
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 201,
        message: 'Return created successfully',
        timestamp: new Date().toISOString(),
        data: transformedReturn
      },
      { status: 201 }
    )

  } catch (error) {
    console.error(' Return POST error:', error)
    
    let errorMessage = 'Failed to create return'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('Supplier') && error.message.includes('not found')) {
        statusCode = 404
        errorMessage = error.message
      } else if (error.message.includes('variation') && error.message.includes('not found')) {
        statusCode = 404
        errorMessage = error.message
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { 
        status: 'error',
        code: statusCode,
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}

/**
 * @swagger
 * /api/return/returnId:
 *   put:
 *     tags:
 *       - Returns
 *     summary: Update return
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplierId:
 *                 type: integer
 *               returnType:
 *                 type: string
 *               returnDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *               remarks:
 *                 type: string
 *               returnStatus:
 *                 type: string
 *               approved:
 *                 type: boolean
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     returnProductId:
 *                       type: integer
 *                     variationId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     remarks:
 *                       type: string
 */

// PUT - Update return (using query parameter)
export async function PUT(request: NextRequest) {
  console.log('Return PUT request started');
  
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

const parsedEmployeeId = authResult.employeeId!
console.log(' Access token verified, employee ID:', parsedEmployeeId);

    // Extract return ID from query parameters
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    
    if (!idParam) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Return ID parameter is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const returnId = parseInt(idParam)
    if (isNaN(returnId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid return ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log(' Update request body:', body);

    // Check if return exists
    const existingReturn = await prisma.returns.findUnique({
      where: { returnId },
      include: {
        returnproduct: true
      }
    })

    if (!existingReturn) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Return not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // OPTIMIZATION: Pre-validate variations if details are provided (batch validation)
    if (body.details && Array.isArray(body.details) && body.details.length > 0) {
      // Validate basic structure first
      for (const detail of body.details) {
        if (!detail.variationId || !detail.quantity || detail.quantity <= 0) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Each detail must have variationId and quantity (> 0)',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
      }

      // Collect all variation IDs
      const variationIds = body.details
        .map((d: any) => d.variationId)
        .filter((id: any): id is number => id !== undefined && id !== null);

      // Fetch all variations in ONE query instead of N queries
      const variations = await prisma.productvariation.findMany({
        where: {
          variationId: { in: variationIds }
        }
      });

      // Create a map for O(1) lookup
      const variationMap = new Map(
        variations.map(v => [v.variationId, v])
      );

      // Validate using the map (no database queries in loop)
      for (const detail of body.details) {
        const variation = variationMap.get(detail.variationId);
        if (!variation) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 404,
              message: `Product variation with ID ${detail.variationId} not found`,
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          )
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Prepare update data for return
      const updateData: any = {}

      if (body.supplierId !== undefined) updateData.supplierId = body.supplierId
      if (body.returnType !== undefined) updateData.returnType = body.returnType
      if (body.returnDate !== undefined) updateData.returnDate = new Date(body.returnDate)
      if (body.reason !== undefined) updateData.reason = body.reason
      if (body.remarks !== undefined) updateData.remarks = body.remarks
      if (body.returnStatus !== undefined) updateData.returnStatus = body.returnStatus
      if (body.approved !== undefined) updateData.approved = body.approved

      // Update return
      const updatedReturn = await tx.returns.update({
        where: { returnId },
        data: updateData
      })

      // Handle return products update if provided
      let returnProducts = existingReturn.returnproduct;
      if (body.details && Array.isArray(body.details)) {
        // Delete existing return products
        await tx.returnproduct.deleteMany({
          where: { returnId }
        })

        // Create new return products
        returnProducts = [];
        for (const detail of body.details) {
          const returnProduct = await tx.returnproduct.create({
            data: {
              returnId: returnId,
              variationId: detail.variationId,
              quantity: detail.quantity,
              remarks: detail.remarks || null
            }
          })
          returnProducts.push(returnProduct);
        }
      }

      // Create transaction log
      await tx.transactionlog.create({
        data: {
          employeeId: parsedEmployeeId,
          actionType: 'UPDATE',
          entityName: 'RETURN',
          referenceId: returnId,
          actionDate: new Date(),
          oldValue: JSON.stringify({
            returnId: existingReturn.returnId,
            supplierId: existingReturn.supplierId,
            returnType: existingReturn.returnType,
            returnDate: existingReturn.returnDate?.toISOString(),
            reason: existingReturn.reason,
            returnStatus: existingReturn.returnStatus,
            approved: existingReturn.approved,
            remarks: existingReturn.remarks,
            productCount: existingReturn.returnproduct.length
          }),
          newValue: JSON.stringify({
            returnId: updatedReturn.returnId,
            supplierId: updatedReturn.supplierId,
            returnType: updatedReturn.returnType,
            returnDate: updatedReturn.returnDate?.toISOString(),
            reason: updatedReturn.reason,
            returnStatus: updatedReturn.returnStatus,
            approved: updatedReturn.approved,
            remarks: updatedReturn.remarks,
            productCount: returnProducts.length,
            updatedBy: parsedEmployeeId
          })
        }
      })

      return { updatedReturn, returnProducts }
    })

    // Get the updated return with full details for response
    const updatedReturnWithDetails = await prisma.returns.findUnique({
      where: { returnId },
      include: {
        supplier: {
          select: {
            supplierId: true,
            supplierName: true
          }
        },
        returnproduct: {
          include: {
            productvariation: {
              include: {
                version: {
                  include: {
                    product: {
                      select: {
                        productId: true,
                        productName: true,
                        sku: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Transform response
    const transformedReturn = {
      returnId: updatedReturnWithDetails!.returnId,
      returnNumber: `RT-${String(updatedReturnWithDetails!.returnId).padStart(6, '0')}`,
      returnedBy: updatedReturnWithDetails!.employeeId,
      returnDate: updatedReturnWithDetails!.returnDate?.toISOString()?.split('T')[0] || null,
      reason: updatedReturnWithDetails!.reason,
      status: updatedReturnWithDetails!.returnStatus,
      remarks: updatedReturnWithDetails!.remarks,
      returnType: updatedReturnWithDetails!.returnType,
      approved: updatedReturnWithDetails!.approved,
      details: updatedReturnWithDetails!.returnproduct.map(rp => ({
        returnProductId: rp.returnProductId,
        productId: rp.productvariation.version.product.productId,
        productName: rp.productvariation.version.product.productName,
        quantityReturned: rp.quantity,
        remarks: rp.remarks
      }))
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Return updated successfully',
        timestamp: new Date().toISOString(),
        data: transformedReturn
      },
      { status: 200 }
    )

  } catch (error) {
    console.error(' Return PUT error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: error instanceof Error ? error.message : 'Failed to update return',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/return/returnId:
 *   delete:
 *     tags:
 *       - Returns
 *     summary: Delete return
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */

// DELETE - Delete return (using query parameter)
export async function DELETE(request: NextRequest) {
  console.log(' Return DELETE request started');
  
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

const parsedEmployeeId = authResult.employeeId!
console.log(' Access token verified, employee ID:', parsedEmployeeId);

    // Extract return ID from query parameters
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    
    if (!idParam) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Return ID parameter is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const returnId = parseInt(idParam)
    if (isNaN(returnId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid return ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check if return exists
    const existingReturn = await prisma.returns.findUnique({
      where: { returnId },
      include: {
        returnproduct: true
      }
    })

    if (!existingReturn) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Return not found',
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
          entityName: 'RETURN',
          referenceId: returnId,
          actionDate: new Date(),
          oldValue: JSON.stringify({
            returnId: existingReturn.returnId,
            supplierId: existingReturn.supplierId,
            returnType: existingReturn.returnType,
            returnDate: existingReturn.returnDate?.toISOString(),
            reason: existingReturn.reason,
            returnStatus: existingReturn.returnStatus,
            approved: existingReturn.approved,
            remarks: existingReturn.remarks,
            productCount: existingReturn.returnproduct.length
          }),
          newValue: JSON.stringify({ deleted: true, deletedBy: parsedEmployeeId })
        }
      })

      // Delete return products first (due to foreign key constraint)
      await tx.returnproduct.deleteMany({
        where: { returnId }
      })

      // Delete return
      await tx.returns.delete({
        where: { returnId }
      })
    })

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Return deleted successfully',
        timestamp: new Date().toISOString(),
        data: null
      },
      { status: 200 }
    )

  } catch (error) {
    console.error(' Return DELETE error:', error)
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