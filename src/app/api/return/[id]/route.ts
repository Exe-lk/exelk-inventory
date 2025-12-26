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
 * /api/return/{id}:
 *   get:
 *     tags:
 *       - Returns
 *     summary: Get return by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */

// GET - Get single return by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(' Return GET by ID request started');
  
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
      console.log(' Access token verified');
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

    const returnId = parseInt(resolvedParams.id)
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

    const returnRecord = await prisma.returns.findUnique({
      where: { returnId },
      include: {
        supplier: {
          select: {
            supplierId: true,
            supplierName: true,
            contactPerson: true,
            email: true,
            phone: true
          }
        },
        employees: {
          select: {
            EmployeeID: true,
            UserName: true,
            Email: true
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
                        sku: true,
                        description: true,
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
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!returnRecord) {
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

    console.log(` Found return with ${returnRecord.returnproduct.length} products`);

    const transformedReturn = {
      returnId: returnRecord.returnId,
      returnNumber: `RT-${String(returnRecord.returnId).padStart(6, '0')}`,
      returnedBy: returnRecord.employeeId,
      returnDate: returnRecord.returnDate?.toISOString()?.split('T')[0] || null,
      reason: returnRecord.reason,
      status: returnRecord.returnStatus,
      remarks: returnRecord.remarks,
      returnType: returnRecord.returnType,
      approved: returnRecord.approved,
      supplier: {
        supplierId: returnRecord.supplier.supplierId,
        supplierName: returnRecord.supplier.supplierName,
        contactPerson: returnRecord.supplier.contactPerson,
        email: returnRecord.supplier.email,
        phone: returnRecord.supplier.phone
      },
      employee: {
        employeeId: returnRecord.employees.EmployeeID,
        userName: returnRecord.employees.UserName,
        email: returnRecord.employees.Email
      },
      details: returnRecord.returnproduct.map(rp => ({
        returnProductId: rp.returnProductId,
        productId: rp.productvariation.version.product.productId,
        productName: rp.productvariation.version.product.productName,
        productSku: rp.productvariation.version.product.sku,
        productDescription: rp.productvariation.version.product.description,
        brandName: rp.productvariation.version.product.brand?.brandName,
        categoryName: rp.productvariation.version.product.category?.categoryName,
        variationId: rp.variationId,
        variationName: rp.productvariation.variationName,
        variationColor: rp.productvariation.color,
        variationSize: rp.productvariation.size,
        variationCapacity: rp.productvariation.capacity,
        quantityReturned: rp.quantity,
        remarks: rp.remarks
      }))
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Return retrieved successfully',
        timestamp: new Date().toISOString(),
        data: transformedReturn
      },
      { status: 200 }
    )

  } catch (error) {
    console.error(' Return GET by ID error:', error)
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



// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   console.log(' Return GET by ID request started');
  
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     try {
//       verifyAccessToken(accessToken)
//       console.log('✅ Access token verified');
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     // Extract return ID from path parameters

//     const { searchParams } = new URL(request.url)
//     const idParam = searchParams.get('id')
    
//     console.log(' ID parameter from query:', idParam);
    
//     if (!idParam) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Return ID parameter is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     const returnId = parseInt(params.id)
//     if (isNaN(returnId)) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Invalid return ID',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     console.log(` Looking for return with ID: ${returnId}`);

//     const returnRecord = await prisma.returns.findUnique({
//       where: { returnId },
//       include: {
//         supplier: {
//           select: {
//             supplierId: true,
//             supplierName: true,
//             contactPerson: true,
//             email: true,
//             phone: true
//           }
//         },
//         employees: {
//           select: {
//             EmployeeID: true,
//             UserName: true,
//             Email: true
//           }
//         },
//         returnproduct: {
//           include: {
//             productvariation: {
//               include: {
//                 version: {
//                   include: {
//                     product: {
//                       select: {
//                         productId: true,
//                         productName: true,
//                         sku: true,
//                         description: true,
//                         brand: {
//                           select: {
//                             brandName: true
//                           }
//                         },
//                         category: {
//                           select: {
//                             categoryName: true
//                           }
//                         }
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     })
//     if (!returnRecord) {
//       console.log(` Return with ID ${returnId} not found`);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Return not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     console.log(` Found return with ${returnRecord.returnproduct.length} products`);

//     const transformedReturn = {
//       returnId: returnRecord.returnId,
//       returnNumber: `RT-${String(returnRecord.returnId).padStart(6, '0')}`,
//       returnedBy: returnRecord.employeeId,
//       returnDate: returnRecord.returnDate?.toISOString()?.split('T')[0] || null,
//       reason: returnRecord.reason,
//       status: returnRecord.returnStatus,
//       remarks: returnRecord.remarks,
//       returnType: returnRecord.returnType,
//       approved: returnRecord.approved,
//       supplier: {
//         supplierId: returnRecord.supplier.supplierId,
//         supplierName: returnRecord.supplier.supplierName,
//         contactPerson: returnRecord.supplier.contactPerson,
//         email: returnRecord.supplier.email,
//         phone: returnRecord.supplier.phone
//       },
//       employee: {
//         employeeId: returnRecord.employees.EmployeeID,
//         userName: returnRecord.employees.UserName,
//         email: returnRecord.employees.Email
//       },
//       details: returnRecord.returnproduct.map(rp => ({
//         returnProductId: rp.returnProductId,
//         productId: rp.productvariation.version.product.productId,
//         productName: rp.productvariation.version.product.productName,
//         productSku: rp.productvariation.version.product.sku,
//         productDescription: rp.productvariation.version.product.description,
//         brandName: rp.productvariation.version.product.brand?.brandName,
//         categoryName: rp.productvariation.version.product.category?.categoryName,
//         variationId: rp.variationId,
//         variationName: rp.productvariation.variationName,
//         variationColor: rp.productvariation.color,
//         variationSize: rp.productvariation.size,
//         variationCapacity: rp.productvariation.capacity,
//         quantityReturned: rp.quantity,
//         remarks: rp.remarks
//       }))
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Return retrieved successfully',
//         timestamp: new Date().toISOString(),
//         data: transformedReturn
//       },
//       { status: 200 }
//     )

//     } catch (error) {
//     console.error(' Return GET by ID error:', error)
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     )
//   }
// }



/**
 * @swagger
 * /api/return/{id}:
 *   put:
 *     tags:
 *       - Returns
 *     summary: Update return
 *     parameters:
 *       - in: path
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

// PUT - Update return
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(' Return PUT request started');
  
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

    let employeeId: number;
    try {
      verifyAccessToken(accessToken)
      employeeId = getEmployeeIdFromToken(accessToken)
      console.log(' Access token verified, employee ID:', employeeId);
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

    const returnId = parseInt(resolvedParams.id)
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
          if (!detail.variationId || !detail.quantity || detail.quantity <= 0) {
            throw new Error('Each detail must have variationId and quantity (> 0)');
          }

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
          employeeId: employeeId,
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
            updatedBy: employeeId
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
 * /api/return/{id}:
 *   delete:
 *     tags:
 *       - Returns
 *     summary: Delete return
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */

// DELETE - Delete return
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(' Return DELETE request started');
  
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

    let employeeId: number;
    try {
      verifyAccessToken(accessToken)
      employeeId = getEmployeeIdFromToken(accessToken)
      console.log(' Access token verified, employee ID:', employeeId);
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

    const returnId = parseInt(resolvedParams.id)
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
          employeeId: employeeId,
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
          newValue: JSON.stringify({ deleted: true, deletedBy: employeeId })
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