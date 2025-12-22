import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

interface GIN {
  ginId: number
  ginNumber: string | null
  employeeId: number
  issuedTo: string | null
  issueReason: string | null
  issueDate: Date | null
  remarks: string | null
  createdDate: Date | null
  updatedDate: Date | null
  stockId: number | null
}

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
 * /api/gin:
 *   get:
 *     tags:
 *       - GIN
 *     summary: Get all GIN records or single GIN by ID with enhanced search
 *     description: Retrieve all GIN records with pagination, sorting, search (GIN number + product name), and filtering, or get a single GIN by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: GIN ID to retrieve specific GIN
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
 *           default: issueDate
 *           enum: [ginNumber, issueDate, issuedTo, createdDate]
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
 *         description: Search term for GIN number, issued to, or product name
 *       - in: query
 *         name: issuedTo
 *         schema:
 *           type: string
 *         description: Filter by issued to
 *       - in: query
 *         name: stockKeeperId
 *         schema:
 *           type: integer
 *         description: Filter by stock keeper (employee) ID
 *       - in: query
 *         name: issueReason
 *         schema:
 *           type: string
 *         description: Filter by issue reason
 *     responses:
 *       200:
 *         description: GIN record(s) retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GIN not found (when using ID parameter)
 *       500:
 *         description: Internal server error
 */

// GET - Retrieve GIN records with enhanced search functionality
export async function GET(request: NextRequest) {
  console.log('🚀 GIN GET request started with enhanced search');
  
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
      console.log('❌ No access token found');
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
      console.log('✅ Access token verified');
    } catch (error) {
      console.log('❌ Invalid access token:', error);
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

    const { searchParams } = new URL(request.url)
    
    // Check if requesting single GIN by ID
    const ginId = searchParams.get('id')
    
    if (ginId) {
      // GET SINGLE GIN BY ID
      console.log(`🔍 Getting single GIN with ID: ${ginId}`);
      
      const parsedGinId = parseInt(ginId)
      if (isNaN(parsedGinId)) {
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
            ginId: parsedGinId
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
          stockId: gin.stockId,
          createdAt: gin.createdDate?.toISOString(),
          updatedAt: gin.updatedDate?.toISOString()
        }

        console.log('✅ Single GIN retrieved successfully');

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
        console.error('💥 Database error:', dbError)
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
    }

    // GET ALL GINs WITH ENHANCED SEARCH FUNCTIONALITY
    console.log('📋 Getting all GINs with enhanced search and filtering');

    // Parse query parameters for list retrieval
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const sortBy = searchParams.get('sortBy') || 'issueDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const issuedToFilter = searchParams.get('issuedTo')
    const stockKeeperId = searchParams.get('stockKeeperId')
    const issueReasonFilter = searchParams.get('issueReason')

    console.log('📊 Query parameters:', { 
      page, limit, sortBy, sortOrder, search, 
      issuedToFilter, stockKeeperId, issueReasonFilter 
    });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause with enhanced search
    const where: any = {}

    // Apply search filter - Enhanced to support GIN number, issued to, and product name search
    if (search) {
      const searchTerm = search.trim();
      console.log(`🔍 Enhanced search term: "${searchTerm}"`);
      
      where.OR = [
        // Search by GIN number
        {
          ginNumber: { 
            contains: searchTerm, 
            mode: 'insensitive' 
          }
        },
        // Search by issued to
        {
          issuedTo: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        // Search by issue reason
        {
          issueReason: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        // Search by product name through GIN details
        {
          gindetails: {
            some: {
              product: {
                productName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            }
          }
        }
      ];
    }

    // Apply filters
    if (issuedToFilter) {
      where.issuedTo = {
        contains: issuedToFilter,
        mode: 'insensitive'
      }
    }

    if (stockKeeperId) {
      where.employeeId = parseInt(stockKeeperId)
    }

    if (issueReasonFilter) {
      where.issueReason = {
        contains: issueReasonFilter,
        mode: 'insensitive'
      }
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['ginNumber', 'issueDate', 'issuedTo', 'createdDate']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'issueDate'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log('🔍 Enhanced where clause:', JSON.stringify(where, null, 2));
    console.log('📈 Order by:', orderBy);

    try {
      console.log('🔌 Testing database connection...');
      await prisma.$connect();
      console.log('✅ Database connected successfully');

      // Get total count for pagination
      console.log('📊 Getting total count...');
      const totalCount = await prisma.gin.count({ where });
      console.log(`📊 Total count: ${totalCount}`);

      // Get GIN records with pagination and enhanced data including product information
      console.log('📋 Fetching GIN records with enhanced search...');
      const gins = await prisma.gin.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
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
          // Include GIN details with product information for search context
          gindetails: {
            select: {
              product: {
                select: {
                  productName: true,
                  sku: true
                }
              }
            },
            take: 3 // Limit to show first 3 products
          }
        }
      }) 

      console.log(`✅ Found ${gins.length} GIN records with enhanced data`);

      // Transform data to match response format with enhanced search context
      const transformedGins = gins.map((gin: any) => ({
        ginId: gin.ginId,
        ginNumber: gin.ginNumber,
        stockKeeperId: gin.employeeId,
        issuedTo: gin.issuedTo,
        issueReason: gin.issueReason,
        issueDate: gin.issueDate?.toISOString().split('T')[0],
        remarks: gin.remarks,
        stockId: gin.stockId,
        createdAt: gin.createdDate?.toISOString(),
        updatedAt: gin.updatedDate?.toISOString(),
        // Include GIN details for search context display
        gindetails: gin.gindetails
      }));

      console.log('✅ GIN records transformed successfully with enhanced search data');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GIN retrieved successfully with enhanced search',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedGins,
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
              issuedTo: issuedToFilter || null,
              stockKeeperId: stockKeeperId ? parseInt(stockKeeperId) : null,
              issueReason: issueReasonFilter || null
            }
          }
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error('💥 Database error:', dbError);
      console.error('🔍 Error details:', {
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      });
      
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve GIN records - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 GIN GET error:', error);
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
 * /api/gin:
 *   post:
 *     tags:
 *       - GIN
 *     summary: Create a complete GIN with details
 *     description: Create a new GIN record with associated GIN details in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ginNumber
 *               - issuedTo
 *               - issueDate
 *               - ginDetails
 *             properties:
 *               ginNumber:
 *                 type: string
 *                 description: GIN number
 *                 example: "GIN-2025-003"
 *               issuedTo:
 *                 type: string
 *                 description: Person/Department goods are issued to
 *                 example: "IT Department"
 *               issueReason:
 *                 type: string
 *                 description: Reason for issuing goods
 *                 example: "New employee setup"
 *               issueDate:
 *                 type: string
 *                 format: date
 *                 description: Issue date
 *                 example: "2025-11-10"
 *               remarks:
 *                 type: string
 *                 description: Remarks
 *                 example: "Issued to new employee"
 *               stockId:
 *                 type: integer
 *                 description: Stock ID
 *                 example: 1
 *               ginDetails:
 *                 type: array
 *                 description: GIN details
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantityIssued
 *                     - unitCost
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       description: Product ID
 *                       example: 1
 *                     quantityIssued:
 *                       type: integer
 *                       description: Quantity issued
 *                       example: 5
 *                     unitCost:
 *                       type: number
 *                       description: Unit cost
 *                       example: 299.99
 *                     location:
 *                       type: string
 *                       description: Location
 *                       example: "WH1"
 *     responses:
 *       201:
 *         description: GIN created successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: GIN number already exists
 *       500:
 *         description: Internal server error
 */

// POST - Create complete GIN with details
export async function POST(request: NextRequest) {
  console.log('🚀 GIN POST request started');
  
  try {
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
      console.log('✅ Access token verified, employee ID:', employeeId);
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

    const body = await request.json()
    
    console.log('📋 Received complete GIN data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const { ginNumber, issuedTo, issueReason, issueDate, remarks, stockId, ginDetails } = body
    
    console.log('📊 Received data:', { ginNumber, issuedTo, issueReason, issueDate, remarks, stockId });
    console.log('👤 Using employee ID:', employeeId);

    if (!ginNumber || !issuedTo || !issueDate) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'GIN number, issued to, and issue date are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate GIN details
    if (!ginDetails || !Array.isArray(ginDetails) || ginDetails.length === 0) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'At least one GIN detail is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate each GIN detail
    for (let i = 0; i < ginDetails.length; i++) {
      const detail = ginDetails[i];
      if (!detail.productId || !detail.quantityIssued || !detail.unitCost) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: `GIN detail ${i + 1}: Product ID, quantity issued, and unit cost are required`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    try {
      // Start transaction for creating complete GIN
      const result = await prisma.$transaction(async (tx) => {
        console.log('🔄 Starting transaction for complete GIN creation');

        // Check if GIN number already exists
        const existingGin = await tx.gin.findFirst({
          where: {
            ginNumber
          }
        })

        if (existingGin) {
          throw new Error('GIN number already exists')
        }

        // Validate stockId if provided
        let validatedStockId = null;
        if (stockId) {
          const existingStock = await tx.stock.findUnique({
            where: {
              stockId: parseInt(stockId)
            }
          })

          if (!existingStock) {
            console.warn(`⚠️ Stock ID ${stockId} not found, creating GIN without stock reference`);
            validatedStockId = null;
          } else {
            validatedStockId = parseInt(stockId);
          }
        }

        // Create GIN
        const ginData = {
          ginNumber,
          employeeId,
          issuedTo: issuedTo.toString(),
          issueReason: issueReason ? issueReason.toString() : null,
          issueDate: new Date(issueDate),
          remarks: remarks || null,
          stockId: validatedStockId,
          createdDate: new Date(),
          updatedDate: new Date()
        }

        console.log('📝 Creating GIN with data:', ginData);

        const createdGin = await tx.gin.create({
          data: ginData,
          select: {
            ginId: true,
            ginNumber: true,
            employeeId: true,
            issuedTo: true,
            issueReason: true,
            issueDate: true,
            remarks: true,
            stockId: true,
            createdDate: true,
            updatedDate: true,
          }
        })

        console.log('✅ Created GIN:', createdGin);

        // Create GIN Details
        const createdDetails = []

        for (const detail of ginDetails) {
          console.log('📦 Processing GIN detail:', detail);

          // Validate product exists
          const existingProduct = await tx.product.findFirst({
            where: {
              productId: parseInt(detail.productId),
              deletedAt: null
            }
          })

          if (!existingProduct) {
            throw new Error(`Invalid product ID: ${detail.productId}`)
          }

          // Calculate subtotal
          const qty = parseInt(detail.quantityIssued)
          const cost = parseFloat(detail.unitCost.toString())
          const subTotal = qty * cost

          const detailData = {
            ginId: createdGin.ginId,
            productId: parseInt(detail.productId),
            quantityIssued: qty,
            unitCost: cost,
            subTotal: subTotal,
            location: detail.location ? detail.location.toString() : null
          }

          console.log('📝 Creating GIN detail with data:', detailData);

          const createdDetail = await tx.gindetails.create({
            data: detailData,
            select: {
              ginDetailId: true,
              ginId: true,
              productId: true,
              quantityIssued: true,
              unitCost: true,
              subTotal: true,
              location: true,
            }
          })

          console.log('✅ Created GIN detail:', createdDetail);

          // Transform detail for response
          const transformedDetail = {
            ginDetailId: createdDetail.ginDetailId,
            ginId: createdDetail.ginId,
            productId: createdDetail.productId,
            quantityIssued: createdDetail.quantityIssued,
            unitCost: createdDetail.unitCost ? parseFloat(createdDetail.unitCost.toString()) : 0,
            subTotal: createdDetail.subTotal ? parseFloat(createdDetail.subTotal.toString()) : 0,
            location: createdDetail.location
          }

          createdDetails.push(transformedDetail)
        }

        return {
          gin: createdGin,
          ginDetails: createdDetails
        }
      })

      // Transform GIN response
      const transformedGin = {
        ginId: result.gin.ginId,
        ginNumber: result.gin.ginNumber,
        stockKeeperId: result.gin.employeeId,
        issuedTo: result.gin.issuedTo,
        issueReason: result.gin.issueReason,
        issueDate: result.gin.issueDate?.toISOString().split('T')[0],
        remarks: result.gin.remarks,
        stockId: result.gin.stockId
      }

      const response = {
        status: 'success',
        code: 201,
        message: 'Complete GIN created successfully',
        timestamp: new Date().toISOString(),
        data: {
          gin: transformedGin,
          ginDetails: result.ginDetails,
          totalDetailsCreated: result.ginDetails.length
        }
      };

      console.log('✅ Returning successful response:', JSON.stringify(response, null, 2));

      return NextResponse.json(response, { status: 201 })

    } catch (dbError) {
      console.error('💥 Database error:', dbError)
      
      // Handle specific error cases
      if (dbError instanceof Error) {
        if (dbError.message === 'GIN number already exists') {
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

        if (dbError.message.startsWith('Invalid product ID')) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: dbError.message,
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create complete GIN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 GIN POST error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/gin:
 *   put:
 *     tags:
 *       - GIN
 *     summary: Update GIN
 *     description: Update a specific GIN record
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
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
 *               stockId:
 *                 type: integer
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
export async function PUT(request: NextRequest) {
  console.log('🚀 GIN PUT request started');
  
  try {
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
      console.log('✅ Access token verified, employee ID:', employeeId);
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

    const { searchParams } = new URL(request.url)
    const ginIdParam = searchParams.get('id')
    const body = await request.json()

    if (!ginIdParam) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'GIN ID is required as query parameter',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const ginId = parseInt(ginIdParam)
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

    console.log(`📝 Updating GIN ID: ${ginId}`, body);

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

      // Validate stockId if provided
      let validatedStockId = existingGin.stockId;
      if (body.stockId !== undefined) {
        if (body.stockId) {
          const existingStock = await prisma.stock.findUnique({
            where: {
              stockId: parseInt(body.stockId)
            }
          })

          if (!existingStock) {
            console.warn(`⚠️ Stock ID ${body.stockId} not found, setting to null`);
            validatedStockId = null;
          } else {
            validatedStockId = parseInt(body.stockId);
          }
        } else {
          validatedStockId = null;
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
      if (body.stockId !== undefined) updateData.stockId = validatedStockId

      console.log('📝 Update data:', updateData);

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

      console.log('✅ GIN updated:', gin);

      // Transform response
      const transformedGin = {
        ginId: gin.ginId,
        ginNumber: gin.ginNumber,
        stockKeeperId: gin.employeeId,
        issuedTo: gin.issuedTo,
        issueReason: gin.issueReason,
        issueDate: gin.issueDate?.toISOString().split('T')[0],
        remarks: gin.remarks,
        stockId: gin.stockId,
        createdAt: gin.createdDate?.toISOString(),
        updatedAt: gin.updatedDate?.toISOString()
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
      console.error('💥 Database error:', dbError)
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
    console.error('💥 GIN PUT error:', error)
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
 * /api/gin:
 *   delete:
 *     tags:
 *       - GIN
 *     summary: Delete GIN
 *     description: Delete a specific GIN record and all related details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: GIN ID
 *     responses:
 *       200:
 *         description: GIN deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GIN not found
 *       500:
 *         description: Internal server error
 */

// DELETE - Delete GIN
export async function DELETE(request: NextRequest) {
  console.log('🚀 GIN DELETE request started');
  
  try {
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
      console.log('✅ Access token verified');
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

    const { searchParams } = new URL(request.url)
    const ginIdParam = searchParams.get('id')

    if (!ginIdParam) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'GIN ID is required as query parameter',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const ginId = parseInt(ginIdParam)
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

    console.log(`🗑️ Deleting GIN ID: ${ginId}`);

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

      // Delete GIN and related details in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete related GIN details first
        console.log('🗑️ Deleting related GIN details...');
        await tx.gindetails.deleteMany({
          where: {
            ginId: ginId
          }
        })

        // Delete the GIN
        console.log('🗑️ Deleting GIN...');
        await tx.gin.delete({
          where: {
            ginId: ginId
          }
        })
      })

      console.log('✅ GIN and related details deleted successfully');

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