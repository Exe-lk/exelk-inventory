import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyAccessToken } from '@/lib/jwt';
import { getAuthTokenFromCookies } from '@/lib/cookies';

/**
 * @swagger
 * /api/stock/export:
 *   post:
 *     tags:
 *       - Stock
 *     summary: Track stock CSV export
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
 * *               remarks:
 *                 type: string
 */
export async function POST(request: NextRequest) {
    console.log(' Stock Export Tracking POST request started');
    
    try {
      // Verify authentication
      const accessToken = getAuthTokenFromCookies(request);
      if (!accessToken) {
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
  
      let employeeId: number;
      try {
        verifyAccessToken(accessToken);
        const payload = verifyAccessToken(accessToken);
        employeeId = payload.userId || 1;
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
            );
          }
      
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
              EmployeeID: employeeId,
              fileName: fileName,
              fileType: 'CSV',
              importDate: new Date(),
              status: 'EXPORTED',
              errorCount: 0,
              remarks: remarks || `Stock export - ${recordCount} records exported`,
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
          console.error(' Stock Export Tracking error:', error);
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