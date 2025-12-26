// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma/client'
// import { verifyAccessToken } from '@/lib/jwt'
// import { getAuthTokenFromCookies } from '@/lib/cookies'

// // Helper function to extract employee ID from token
// function getEmployeeIdFromToken(accessToken: string): number {
//   try {
//     const payload = verifyAccessToken(accessToken);
//     return payload.userId || 1;
//   } catch (error) {
//     console.error('Error extracting employee ID from token:', error);
//     return 1;
//   }
// }

// /**
//  * @swagger
//  * /api/stocks/{id}:
//  *   get:
//  *     tags:
//  *       - Stocks
//  *     summary: Get single stock
//  *     description: Retrieve a single stock record by ID
//  *     security:
//  *       - cookieAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: Stock ID
//  *     responses:
//  *       200:
//  *         description: Stock retrieved successfully
//  *       401:
//  *         description: Unauthorized
//  *       404:
//  *         description: Stock not found
//  *       500:
//  *         description: Internal server error
//  */

// // GET - Get single stock by ID
// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   console.log('🚀 Single Stock GET request started for ID:', params.id);
  
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

//     const stockId = parseInt(params.id)
//     if (isNaN(stockId)) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Invalid stock ID',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Get stock by ID
//       const stock = await prisma.stock.findUnique({
//         where: { stockId },
//         select: {
//           stockId: true,
//           productId: true,
//           quantityAvailable: true,
//           reorderLevel: true,
//           lastUpdatedDate: true,
//           variationId: true,
//           location: true,
//         }
//       });

//       if (!stock) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'Stock not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Transform response
//       const transformedStock = {
//         stockID: stock.stockId,
//         productID: stock.productId,
//         variationID: stock.variationId,
//         locationID: null, // Not available in current schema
//         quantityAvailable: stock.quantityAvailable || 0,
//         reorderLevel: stock.reorderLevel || 0,
//         lastUpdatedDate: stock.lastUpdatedDate?.toISOString(),
//         location: stock.location
//       };

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'Stock retrieved successfully',
//           timestamp: new Date().toISOString(),
//           data: transformedStock
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error('❌ Database error:', dbError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to retrieve stock',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error('❌ Stock GET error:', error);
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

// /**
//  * @swagger
//  * /api/stocks/{id}:
//  *   put:
//  *     tags:
//  *       - Stocks
//  *     summary: Update stock
//  *     description: Update a stock record
//  *     security:
//  *       - cookieAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: Stock ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               productID:
//  *                 type: integer
//  *               variationID:
//  *                 type: integer
//  *               quantityAvailable:
//  *                 type: integer
//  *               reorderLevel:
//  *                 type: integer
//  *               location:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Stock updated successfully
//  *       400:
//  *         description: Bad request
//  *       401:
//  *         description: Unauthorized
//  *       404:
//  *         description: Stock not found
//  *       500:
//  *         description: Internal server error
//  */

// // PUT - Update stock
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   console.log('🚀 Stock PUT request started for ID:', params.id);
  
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

//     const stockId = parseInt(params.id)
//     if (isNaN(stockId)) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Invalid stock ID',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     const body = await request.json()
//     console.log('📝 Update request body:', body);

//     try {
//       // Check if stock exists
//       const existingStock = await prisma.stock.findUnique({
//         where: { stockId }
//       });

//       if (!existingStock) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'Stock not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Prepare update data
//       const updateData: any = {
//         lastUpdatedDate: new Date()
//       };

//       if (body.productID !== undefined) updateData.productId = body.productID;
//       if (body.variationID !== undefined) updateData.variationId = body.variationID;
//       if (body.quantityAvailable !== undefined) updateData.quantityAvailable = body.quantityAvailable;
//       if (body.reorderLevel !== undefined) updateData.reorderLevel = body.reorderLevel;
//       if (body.location !== undefined) updateData.location = body.location;

//       // Update stock
//       const updatedStock = await prisma.stock.update({
//         where: { stockId },
//         data: updateData,
//         select: {
//           stockId: true,
//           productId: true,
//           quantityAvailable: true,
//           reorderLevel: true,
//           lastUpdatedDate: true,
//           variationId: true,
//           location: true,
//         }
//       });

//       // Transform response
//       const transformedStock = {
//         stockID: updatedStock.stockId,
//         productID: updatedStock.productId,
//         variationID: updatedStock.variationId,
//         locationID: null,
//         quantityAvailable: updatedStock.quantityAvailable || 0,
//         reorderLevel: updatedStock.reorderLevel || 0,
//         lastUpdatedDate: updatedStock.lastUpdatedDate?.toISOString(),
//         location: updatedStock.location
//       };

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'Stock updated successfully',
//           timestamp: new Date().toISOString(),
//           data: transformedStock
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error('❌ Database error:', dbError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to update stock',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error('❌ Stock PUT error:', error);
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

// /**
//  * @swagger
//  * /api/stocks/{id}:
//  *   delete:
//  *     tags:
//  *       - Stocks
//  *     summary: Delete stock
//  *     description: Delete a stock record
//  *     security:
//  *       - cookieAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: Stock ID
//  *     responses:
//  *       200:
//  *         description: Stock deleted successfully
//  *       401:
//  *         description: Unauthorized
//  *       404:
//  *         description: Stock not found
//  *       500:
//  *         description: Internal server error
//  */

// // DELETE - Delete stock
// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   console.log('🚀 Stock DELETE request started for ID:', params.id);
  
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

//     const stockId = parseInt(params.id)
//     if (isNaN(stockId)) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Invalid stock ID',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Check if stock exists
//       const existingStock = await prisma.stock.findUnique({
//         where: { stockId }
//       });

//       if (!existingStock) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'Stock not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Delete stock
//       await prisma.stock.delete({
//         where: { stockId }
//       });

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'Stock deleted successfully',
//           timestamp: new Date().toISOString(),
//           data: null
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error(' Database error:', dbError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to delete stock',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error(' Stock DELETE error:', error);
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







import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

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
  { params }: { params:  Promise<{ id: string }> }
) {
  console.log(' Stock PUT request started');
  
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
      const payload = verifyAccessToken(accessToken);
      employeeId = payload.userId || 1;
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
          employeeId: employeeId,
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
      const payload = verifyAccessToken(accessToken);
      employeeId = payload.userId || 1;
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
          employeeId: employeeId,
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