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
 * /api/gin/{id}:
 *   get:
 *     tags:
 *       - GIN
 *     summary: Get GIN by ID
 *     description: Retrieve a specific GIN record by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: GIN ID
 *     responses:
 *       200:
 *         description: GIN retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GIN not found
 *       500:
 *         description: Internal server error
 */

// GET - Get single GIN by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const ginId = parseInt(resolvedParams.id)

    if (isNaN(ginId)) {
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

    try {
      // Get GIN by ID
      const gin = await prisma.gin.findUnique({
        where: {
          ginId: ginId
        },
        select: {
          ginId: true,
          ginNumber: true,
          employeeId: true,
          issuedTo: true,
          issueReason: true,
          issueDate: true,
          remarks: true,
          createdDate: true,
          updatedDate: true,
          stockId: true,
        }
      })

      if (!gin) {
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

      // Transform response
      const transformedGin = {
        ginId: gin.ginId,
        ginNumber: gin.ginNumber,
        stockKeeperId: gin.employeeId,
        issuedTo: gin.issuedTo,
        issueReason: gin.issueReason,
        issueDate: gin.issueDate?.toISOString().split('T')[0],
        remarks: gin.remarks,
        stockId: gin.stockId
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GIN retrieved successfully',
          timestamp: new Date().toISOString(),
          data: transformedGin
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve GIN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GIN GET error:', error)
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
 * /api/gin/{id}:
 *   put:
 *     tags:
 *       - GIN
 *     summary: Update GIN
 *     description: Update a specific GIN record
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: GIN ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ginNumber:
 *                 type: string
 *               issuedTo:
 *                 type: string
 *               issueReason:
 *                 type: string
 *               issueDate:
 *                 type: string
 *                 format: date
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: GIN updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GIN not found
 *       409:
 *         description: GIN number already exists
 *       500:
 *         description: Internal server error
 */

// PUT - Update GIN
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const ginId = parseInt(resolvedParams.id)
    const body = await request.json()

    if (isNaN(ginId)) {
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

    try {
      // Check if GIN exists
      const existingGin = await prisma.gin.findUnique({
        where: {
          ginId: ginId
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

      // Check if GIN number already exists (excluding current GIN)
      if (body.ginNumber && body.ginNumber !== existingGin.ginNumber) {
        const duplicateGin = await prisma.gin.findFirst({
          where: {
            ginNumber: body.ginNumber,
            ginId: { not: ginId }
          }
        })

        if (duplicateGin) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'GIN number already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // Prepare update data
      const updateData: any = {
        updatedDate: new Date()
      }

      if (body.ginNumber !== undefined) updateData.ginNumber = body.ginNumber
      if (body.issuedTo !== undefined) updateData.issuedTo = body.issuedTo
      if (body.issueReason !== undefined) updateData.issueReason = body.issueReason
      if (body.issueDate !== undefined) updateData.issueDate = new Date(body.issueDate)
      if (body.remarks !== undefined) updateData.remarks = body.remarks

      // Update GIN
      const gin = await prisma.gin.update({
        where: {
          ginId: ginId
        },
        data: updateData,
        select: {
          ginId: true,
          ginNumber: true,
          employeeId: true,
          issuedTo: true,
          issueReason: true,
          issueDate: true,
          remarks: true,
          createdDate: true,
          updatedDate: true,
          stockId: true,
        }
      })

      // Transform response
      const transformedGin = {
        ginId: gin.ginId,
        ginNumber: gin.ginNumber,
        stockKeeperId: gin.employeeId,
        issuedTo: gin.issuedTo,
        issueReason: gin.issueReason,
        issueDate: gin.issueDate?.toISOString().split('T')[0],
        remarks: gin.remarks,
        stockId: gin.stockId
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GIN updated successfully',
          timestamp: new Date().toISOString(),
          data: transformedGin
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update GIN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GIN PUT error:', error)
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
 * /api/gin/{id}:
 *   delete:
 *     tags:
 *       - GIN
 *     summary: Delete GIN
 *     description: Delete a specific GIN record
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: GIN ID
 *     responses:
 *       200:
 *         description: GIN deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GIN not found
 *       500:
 *         description: Internal server error
 */

// DELETE - Delete GIN
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const ginId = parseInt(resolvedParams.id)

    if (isNaN(ginId)) {
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

    try {
      // Check if GIN exists
      const existingGin = await prisma.gin.findUnique({
        where: {
          ginId: ginId
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

      // Delete GIN and related details
      await prisma.$transaction(async (tx) => {
        // Delete related GIN details first
        await tx.gindetails.deleteMany({
          where: {
            ginId: ginId
          }
        })

        // Delete the GIN
        await tx.gin.delete({
          where: {
            ginId: ginId
          }
        })
      })

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GIN deleted successfully',
          timestamp: new Date().toISOString(),
          data: null
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error('💥 Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete GIN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 GIN DELETE error:', error)
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

// // GET - Get single GIN by ID
// export async function GET(
//   request: NextRequest,
//   {params}: { params: { ginId: string }  }
// ) {
//   try {
//     const ginId = parseInt(params.ginId, 10);
    
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

//     if (isNaN(ginId)) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Invalid GIN ID',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Get GIN by ID
//       const gin = await prisma.gin.findUnique({
//         where: {
//           ginId: ginId
//         },
//         select: {
//           ginId: true,
//           ginNumber: true,
//           employeeId: true,
//           issuedTo: true,
//           issueReason: true,
//           issueDate: true,
//           remarks: true,
//           createdDate: true,
//           updatedDate: true,
//           stockId: true,
//         }
//       })

//       if (!gin) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'GIN not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Transform response
//       const transformedGin = {
//         ginId: gin.ginId,
//         ginNumber: gin.ginNumber,
//         stockKeeperId: gin.employeeId,
//         issuedTo: gin.issuedTo,
//         issueReason: gin.issueReason,
//         issueDate: gin.issueDate?.toISOString().split('T')[0],
//         remarks: gin.remarks,
//         stockId: gin.stockId
//       }

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'GIN retrieved successfully',
//           timestamp: new Date().toISOString(),
//           data: transformedGin
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error('💥 Database error:', dbError)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to retrieve GIN',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error('💥 GIN GET error:', error)
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

// // PUT - Update GIN
// export async function PUT(
//   request: NextRequest,
//   {params}: { params: { ginId: string } }
// ) {
//   try {
//     const ginId = parseInt(params.ginId, 10);
    
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

//     let employeeId: number;
//     try {
//       verifyAccessToken(accessToken)
//       employeeId = getEmployeeIdFromToken(accessToken)
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

//     const body = await request.json()

//     if (isNaN(ginId)) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Invalid GIN ID',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Check if GIN exists
//       const existingGin = await prisma.gin.findUnique({
//         where: {
//           ginId: ginId
//         }
//       })

//       if (!existingGin) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'GIN not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Prepare update data
//       const updateData: any = {
//         updatedDate: new Date()
//       }

//       if (body.ginNumber !== undefined) updateData.ginNumber = body.ginNumber
//       if (body.issuedTo !== undefined) updateData.issuedTo = body.issuedTo
//       if (body.issueReason !== undefined) updateData.issueReason = body.issueReason
//       if (body.issueDate !== undefined) updateData.issueDate = new Date(body.issueDate)
//       if (body.remarks !== undefined) updateData.remarks = body.remarks

//       // Update GIN
//       const gin = await prisma.gin.update({
//         where: {
//           ginId: ginId
//         },
//         data: updateData,
//         select: {
//           ginId: true,
//           ginNumber: true,
//           employeeId: true,
//           issuedTo: true,
//           issueReason: true,
//           issueDate: true,
//           remarks: true,
//           createdDate: true,
//           updatedDate: true,
//           stockId: true,
//         }
//       })

//       // Transform response
//       const transformedGin = {
//         ginId: gin.ginId,
//         ginNumber: gin.ginNumber,
//         stockKeeperId: gin.employeeId,
//         issuedTo: gin.issuedTo,
//         issueReason: gin.issueReason,
//         issueDate: gin.issueDate?.toISOString().split('T')[0],
//         remarks: gin.remarks,
//         stockId: gin.stockId
//       }

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'GIN updated successfully',
//           timestamp: new Date().toISOString(),
//           data: transformedGin
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error('💥 Database error:', dbError)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to update GIN',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error('💥 GIN PUT error:', error)
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

// // DELETE - Delete GIN
// export async function DELETE(
//   request: NextRequest,
//   {params}: { params: { ginId: string } }
// ) {
//   try {
//      const ginId = parseInt(params.ginId, 10);
    
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

//     if (isNaN(ginId)) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Invalid GIN ID',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     try {
//       // Check if GIN exists
//       const existingGin = await prisma.gin.findUnique({
//         where: {
//           ginId: ginId
//         }
//       })

//       if (!existingGin) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 404,
//             message: 'GIN not found',
//             timestamp: new Date().toISOString()
//           },
//           { status: 404 }
//         )
//       }

//       // Delete GIN and related details
//       await prisma.$transaction(async (tx) => {
//         // Delete related GIN details first
//         await tx.gindetails.deleteMany({
//           where: {
//             ginId: ginId
//           }
//         })

//         // Delete the GIN
//         await tx.gin.delete({
//           where: {
//             ginId: ginId
//           }
//         })
//       })

//       return NextResponse.json(
//         {
//           status: 'success',
//           code: 200,
//           message: 'GIN deleted successfully',
//           timestamp: new Date().toISOString(),
//           data: null
//         },
//         { status: 200 }
//       )

//     } catch (dbError) {
//       console.error('💥 Database error:', dbError)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to delete GIN',
//           timestamp: new Date().toISOString(),
//           details: dbError instanceof Error ? dbError.message : 'Unknown database error'
//         },
//         { status: 500 }
//       )
//     }

//   } catch (error) {
//     console.error('💥 GIN DELETE error:', error)
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


















