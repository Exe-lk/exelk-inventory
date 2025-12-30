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
 * /api/imports/{id}:
 *   get:
 *     tags:
 *       - Import Files
 *     summary: Get import file by ID
 *     description: Retrieve a specific import file by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Import file ID
 *     responses:
 *       200:
 *         description: Import file retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Import file not found
 *       500:
 *         description: Internal server error
 */

// GET - Get single import file
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

    const importId = parseInt(resolvedParams.id)

    if (isNaN(importId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid import file ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Get import file by ID
      const importFile = await prisma.importfile.findUnique({
        where: {
          importId
        },
        select: {
          importId: true,
          EmployeeID: true,
          fileName: true,
          fileType: true,
          importDate: true,
          status: true,
          errorCount: true,
          remarks: true,
          filePath: true,
        }
      })

      if (!importFile) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Import file not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Transform response to match the expected format
      const transformedImportFile = {
        importId: importFile.importId,
        fileName: importFile.fileName,
        fileType: importFile.fileType,
        uploadedBy: importFile.EmployeeID,
        uploadedDate: importFile.importDate,
        status: importFile.status,
        totalRecords: null, // These fields might need to be calculated or stored separately
        processedRecords: null,
        failedRecords: importFile.errorCount,
        remarks: importFile.remarks
      }

      return NextResponse.json(
        {
          success: true,
          data: transformedImportFile
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve import file',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Import File GET error:', error)
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
 * /api/imports/{id}:
 *   delete:
 *     tags:
 *       - Import Files
 *     summary: Delete import file
 *     description: Delete an import file record from the system
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Import file ID
 *     responses:
 *       204:
 *         description: Import file deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Import file not found
 *       500:
 *         description: Internal server error
 */

// DELETE - Delete import file
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

    const importId = parseInt(resolvedParams.id)

    if (isNaN(importId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid import file ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if import file exists
      const existingImportFile = await prisma.importfile.findUnique({
        where: {
          importId
        }
      })

      if (!existingImportFile) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Import file not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Delete the import file
      await prisma.importfile.delete({
        where: {
          importId
        }
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Import file deleted successfully',
          data: {
            importId
          }
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete import file',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Import File DELETE error:', error)
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