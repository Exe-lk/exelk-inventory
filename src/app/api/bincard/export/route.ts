import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';

/**
 * @swagger
 * /api/bincard/export:
 *   post:
 *     tags:
 *       - BinCards
 *     summary: Track bin card CSV export
 *     description: Create a record in importfile table for CSV export tracking
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - recordCount
 *             properties:
 *               fileName:
 *                 type: string
 *               recordCount:
 *                 type: integer
 *               remarks:
 *                 type: string
 */
export async function POST(request: NextRequest) {
  console.log(' Bin Card Export Tracking POST request started');
  
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Get employee ID from session metadata
    const employeeId = session.user.user_metadata?.employee_id;
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'User metadata not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    console.log(' Access token verified, employee ID:', employeeId);

    const body = await request.json();
    const { fileName, recordCount, remarks } = body;

    if (!fileName || recordCount === undefined) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'fileName and recordCount are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Create importfile record for export
    const importFileRecord = await prisma.importfile.create({
      data: {
        EmployeeID: parseInt(employeeId),
        fileName: fileName,
        fileType: 'CSV',
        importDate: new Date(),
        status: 'EXPORTED',
        errorCount: 0,
        remarks: remarks || `Bin card export - ${recordCount} records exported`,
        filePath: null
      }
    });
    console.log(' Created export tracking record:', importFileRecord.importId);

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Export tracked successfully',
        timestamp: new Date().toISOString(),
        data: {
          importFileId: importFileRecord.importId,
          fileName: importFileRecord.fileName,
          recordCount: recordCount
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(' Bin Card Export Tracking error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Failed to track export',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}