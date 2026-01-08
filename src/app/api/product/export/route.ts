// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma/client';
// import { verifyAccessToken } from '@/lib/jwt';
// import { getAuthTokenFromCookies } from '@/lib/cookies';

// /**
//  * @swagger
//  * /api/product/export:
//  *   post:
//  *     tags:
//  *       - Products
//  *     summary: Track product CSV export
//  *     description: Create a record in importfile table for CSV export tracking
//  *     security:
//  *       - cookieAuth: []
//  */
// export async function POST(request: NextRequest) {
//   console.log(' Product Export Tracking POST request started');
  
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request);
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       );
//     }

//     let employeeId: number;
//     try {
//       verifyAccessToken(accessToken);
//       const payload = verifyAccessToken(accessToken);
//       employeeId = payload.userId || 1;
//       console.log(' Access token verified, employee ID:', employeeId);
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       );
//     }

//     const body = await request.json();
//     const { fileName, recordCount, remarks } = body;

//     if (!fileName || recordCount === undefined) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'fileName and recordCount are required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       );
//     }

//     // Create importfile record for export
//     const importFileRecord = await prisma.importfile.create({
//       data: {
//         EmployeeID: employeeId,
//         fileName: fileName,
//         fileType: 'CSV',
//         importDate: new Date(),
//         status: 'EXPORTED',
//         errorCount: 0,
//         remarks: remarks || `Product export - ${recordCount} records exported`,
//         filePath: null
//       }
//     });
//     console.log(' Created export tracking record:', importFileRecord.importId);

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Export tracked successfully',
//         timestamp: new Date().toISOString(),
//         data: {
//           importFileId: importFileRecord.importId,
//           fileName: importFileRecord.fileName,
//           recordCount: recordCount
//         }
//       },
//       { status: 200 }
//     );

//   } catch (error) {
//     console.error(' Product Export Tracking error:', error);
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Failed to track export',
//         timestamp: new Date().toISOString(),
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// }
















import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';

/**
 * @swagger
 * /api/product/export:
 *   post:
 *     tags:
 *       - Products
 *     summary: Track product CSV export
 *     description: Create a record in importfile table for CSV export tracking
 *     security:
 *       - cookieAuth: []
 */
export async function POST(request: NextRequest) {
  console.log(' Product Export Tracking POST request started');
  
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
          message: 'Invalid session - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const parsedEmployeeId = parseInt(employeeId.toString());
    console.log(' Access token verified, employee ID:', parsedEmployeeId);

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
        EmployeeID: parsedEmployeeId,
        fileName: fileName,
        fileType: 'CSV',
        importDate: new Date(),
        status: 'EXPORTED',
        errorCount: 0,
        remarks: remarks || `Product export - ${recordCount} records exported`,
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
    console.error(' Product Export Tracking error:', error);
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
