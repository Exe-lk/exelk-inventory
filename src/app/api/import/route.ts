import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'

interface ImportFile {
  importId: number
  EmployeeID: number
  fileName: string | null
  fileType: string | null
  importDate: Date | null
  status: string | null
  errorCount: number | null
  remarks: string | null
  filePath: string | null
}

/**
 * @swagger
 * /api/imports:
 *   get:
 *     tags:
 *       - Import Files
 *     summary: Get all import files
 *     description: Retrieve all import files with pagination, sorting, search, and filtering
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: importDate
 *           enum: [fileName, fileType, importDate, status, EmployeeID]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for file name or remarks
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *         description: Filter by file type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Import files retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// GET - Retrieve import files with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Import Files GET request started');
  
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.log(' No access token found');
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

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const sortBy = searchParams.get('sortBy') || 'importDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const fileType = searchParams.get('fileType')
    const status = searchParams.get('status')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, fileType, status });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Apply search filter
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Apply filters
    if (fileType) {
      where.fileType = fileType
    }

    if (status) {
      where.status = status
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['fileName', 'fileType', 'importDate', 'status', 'EmployeeID']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'importDate'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {
      console.log(' Testing database connection...');
      await prisma.$connect();
      console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.importfile.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get import files with pagination
      console.log(' Fetching import files...');
      const importFiles: ImportFile[] = await prisma.importfile.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
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
      }) as ImportFile[];

      console.log(` Found ${importFiles.length} import files`);

      // Transform data to match response format
      const transformedImportFiles = importFiles.map((importFile: any) => ({
        ImportID: importFile.importId,
        StockKeeperID: importFile.EmployeeID,
        FileName: importFile.fileName,
        FileType: importFile.fileType,
        ImportDate: importFile.importDate,
        Status: importFile.status,
        ErrorCount: importFile.errorCount,
        Remarks: importFile.remarks,
        FilePath: importFile.filePath
      }));

      console.log(' Import files transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Import files retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedImportFiles,
            pagination: {
              totalItems: totalCount,
              page,
              limit,
              totalPages: Math.ceil(totalCount / limit)
            },
            sorting: {
              sortBy,
              sortOrder
            },
            search: search || null,
            filters: {
              fileType: fileType || null,
              status: status || null
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
          message: 'Failed to retrieve import files - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Import Files GET error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * @swagger
 * /api/imports:
 *   post:
 *     tags:
 *       - Import Files
 *     summary: Create a new import file record
 *     description: Create a new import file record in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - StockKeeperID
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               StockKeeperID:
 *                 type: integer
 *                 description: Employee ID uploading the file
 *     responses:
 *       201:
 *         description: Import file created successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

// POST - Create new import file record
export async function POST(request: NextRequest) {
  console.log(' Import Files POST request started');
  
  try {
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

    // Handle FormData (file upload)
    let fileName: string;
    let fileType: string;
    let filePath: string;
    let remarks: string | null = null;
    let stockKeeperID: number;

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const remarksField = formData.get('remarks') as string;
      const stockKeeperIDField = formData.get('StockKeeperID') as string;

      if (!file) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'File is required',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Validate file type
      const allowedExtensions = ['xlsx', 'xls', 'csv'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'File size must be less than 10MB.',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Extract file information
      fileName = file.name;
      fileType = fileExtension;
      
      // Create file path (you might want to save the actual file here)
      const timestamp = Date.now();
      filePath = `/uploads/${timestamp}_${fileName}`;
      
      // TODO: Save the actual file to your storage system
      // const buffer = await file.arrayBuffer();
      // await saveFileToStorage(buffer, filePath);

      remarks = remarksField || null;
      stockKeeperID = stockKeeperIDField ? parseInt(stockKeeperIDField) : parsedEmployeeId;

      console.log(' Processed file upload:', { fileName, fileType, filePath, remarks, stockKeeperID });

    } catch (error) {
      console.error('Error processing form data:', error);
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid form data',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Create new import file record
      const importFile = await prisma.importfile.create({
        data: {
          EmployeeID: stockKeeperID,
          fileName,
          fileType,
          filePath,
          status: 'processing', // Default status
          errorCount: 0, // Default error count
          remarks
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

      console.log(' Import file created:', importFile);

      // Transform response
      const transformedImportFile = {
        ImportID: importFile.importId,
        StockKeeperID: importFile.EmployeeID,
        FileName: importFile.fileName,
        FileType: importFile.fileType,
        ImportDate: importFile.importDate,
        Status: importFile.status,
        ErrorCount: importFile.errorCount,
        Remarks: importFile.remarks,
        FilePath: importFile.filePath
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'Import file created successfully',
          timestamp: new Date().toISOString(),
          data: transformedImportFile,
          errors: null
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create import file',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Import Files POST error:', error)
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