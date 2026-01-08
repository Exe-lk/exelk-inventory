import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'

interface GRN {
  grnId: number
  grnNumber: string | null
  supplierId: number
  employeeId: number
  receivedDate: Date | null
  totalAmount: number | null
  remarks: string | null
  createdDate: Date | null
  updatedDate: Date | null
  stockId: number | null
}

// Helper function to extract employee ID from Supabase session
async function getEmployeeIdFromSession(request: NextRequest): Promise<number | null> {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }
    
    const employeeId = session.user.user_metadata?.employee_id
    return employeeId ? parseInt(employeeId.toString()) : null
  } catch (error) {
    console.error('Error extracting employee ID from session:', error)
    return null
  }
}

/**
 * @swagger
 * /api/grn:
 *   get:
 *     tags:
 *       - GRN
 *     summary: Get all GRN records or single GRN by ID with enhanced search
 *     description: Retrieve all GRN records with pagination, sorting, search (GRN number + product name), and filtering, or get a single GRN by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: GRN ID to retrieve specific GRN
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
 *           default: receivedDate
 *           enum: [grnNumber, receivedDate, totalAmount, createdDate]
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
 *         description: Search term for GRN number or product name
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: integer
 *         description: Filter by supplier ID
 *       - in: query
 *         name: stockKeeperId
 *         schema:
 *           type: integer
 *         description: Filter by stock keeper (employee) ID
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum total amount filter
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum total amount filter
 *     responses:
 *       200:
 *         description: GRN record(s) retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN not found (when using ID parameter)
 *       500:
 *         description: Internal server error
 */

// GET - Retrieve GRN records with enhanced search functionality
export async function GET(request: NextRequest) {
  console.log(' GRN GET request started with enhanced search');
  
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log(' No valid session found');
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

    console.log(' Session verified');

    const { searchParams } = new URL(request.url)
    
    // Check if requesting single GRN by ID
    const grnId = searchParams.get('id')
    
    if (grnId) {
      // GET SINGLE GRN BY ID
      console.log(` Getting single GRN with ID: ${grnId}`);
      
      const parsedGrnId = parseInt(grnId)
      if (isNaN(parsedGrnId)) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid GRN ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      try {
        // Get GRN by ID
        const grn = await prisma.grn.findUnique({
          where: {
            grnId: parsedGrnId
          },
          select: {
            grnId: true,
            grnNumber: true,
            supplierId: true,
            employeeId: true,
            receivedDate: true,
            totalAmount: true,
            remarks: true,
            createdDate: true,
            updatedDate: true,
            stockId: true,
          }
        })

        if (!grn) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 404,
              message: 'GRN not found',
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          )
        }

        // Transform response
        const transformedGrn = {
          grnId: grn.grnId,
          grnNumber: grn.grnNumber,
          supplierId: grn.supplierId,
          stockKeeperId: grn.employeeId,
          receivedDate: grn.receivedDate?.toISOString().split('T')[0],
          totalAmount: grn.totalAmount ? parseFloat(grn.totalAmount.toString()) : 0,
          remarks: grn.remarks,
          createdAt: grn.createdDate?.toISOString(),
          updatedAt: grn.updatedDate?.toISOString()
        }

        console.log(' Single GRN retrieved successfully');

        return NextResponse.json(
          {
            status: 'success',
            code: 200,
            message: 'GRN retrieved successfully',
            timestamp: new Date().toISOString(),
            data: transformedGrn
          },
          { status: 200 }
        )

      } catch (dbError) {
        console.error(' Database error:', dbError)
        return NextResponse.json(
          { 
            status: 'error',
            code: 500,
            message: 'Failed to retrieve GRN',
            timestamp: new Date().toISOString(),
            details: dbError instanceof Error ? dbError.message : 'Unknown database error'
          },
          { status: 500 }
        )
      }
    }

    // GET ALL GRNs WITH ENHANCED SEARCH FUNCTIONALITY
    console.log(' Getting all GRNs with enhanced search and filtering');

    // Parse query parameters for list retrieval
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const sortBy = searchParams.get('sortBy') || 'receivedDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const supplierId = searchParams.get('supplierId')
    const stockKeeperId = searchParams.get('stockKeeperId')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')

    console.log(' Query parameters:', { 
      page, limit, sortBy, sortOrder, search, 
      supplierId, stockKeeperId, minAmount, maxAmount 
    });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause with enhanced search
    const where: any = {}

    // Apply search filter - Enhanced to support both GRN number and product name search
    if (search) {
      const searchTerm = search.trim();
      console.log(` Enhanced search term: "${searchTerm}"`);
      
      where.OR = [
        // Search by GRN number (existing functionality)
        {
          grnNumber: { 
            contains: searchTerm, 
            mode: 'insensitive' 
          }
        },
        // Search by product name through GRN details (new functionality)
        {
          grndetails: {
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

    // Apply filters (rest remains the same)
    if (supplierId) {
      where.supplierId = parseInt(supplierId)
    }

    if (stockKeeperId) {
      where.employeeId = parseInt(stockKeeperId)
    }

    if (minAmount || maxAmount) {
      where.totalAmount = {}
      if (minAmount) where.totalAmount.gte = parseFloat(minAmount)
      if (maxAmount) where.totalAmount.lte = parseFloat(maxAmount)
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['grnNumber', 'receivedDate', 'totalAmount', 'createdDate']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'receivedDate'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Enhanced where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {
      console.log(' Testing database connection...');
      await prisma.$connect();
      console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.grn.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get GRN records with pagination and enhanced data including product information
      console.log(' Fetching GRN records with enhanced search...');
      const grns = await prisma.grn.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          grnId: true,
          grnNumber: true,
          supplierId: true,
          employeeId: true,
          receivedDate: true,
          totalAmount: true,
          remarks: true,
          createdDate: true,
          updatedDate: true,
          stockId: true,
          // Include GRN details with product information for search context
          grndetails: {
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

      console.log(` Found ${grns.length} GRN records with enhanced data`);

      // Transform data to match response format with enhanced search context
      const transformedGrns = grns.map((grn: any) => ({
        grnId: grn.grnId,
        grnNumber: grn.grnNumber,
        supplierId: grn.supplierId,
        stockKeeperId: grn.employeeId,
        receivedDate: grn.receivedDate?.toISOString().split('T')[0],
        totalAmount: grn.totalAmount ? parseFloat(grn.totalAmount.toString()) : 0,
        remarks: grn.remarks,
        createdAt: grn.createdDate?.toISOString(),
        updatedAt: grn.updatedDate?.toISOString(),
        // Include GRN details for search context display
        grndetails: grn.grndetails
      }));

      console.log(' GRN records transformed successfully with enhanced search data');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GRN retrieved successfully with enhanced search',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedGrns,
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
              supplierId: supplierId ? parseInt(supplierId) : null,
              stockKeeperId: stockKeeperId ? parseInt(stockKeeperId) : null,
              minAmount: minAmount ? parseFloat(minAmount) : null,
              maxAmount: maxAmount ? parseFloat(maxAmount) : null
            }
          }
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError);
      console.error(' Error details:', {
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      });
      
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve GRN records - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN GET error:', error);
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
 * /api/grn:
 *   post:
 *     tags:
 *       - GRN
 *     summary: Create a complete GRN with details
 *     description: Create a new GRN record with associated GRN details in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grnNumber
 *               - supplierId
 *               - receivedDate
 *               - grnDetails
 *             properties:
 *               grnNumber:
 *                 type: string
 *                 description: GRN number
 *                 example: "GRN-2025-003"
 *               supplierId:
 *                 type: integer
 *                 description: Supplier ID
 *                 example: 1
 *               receivedDate:
 *                 type: string
 *                 format: date
 *                 description: Received date
 *                 example: "2025-11-10"
 *               totalAmount:
 *                 type: number
 *                 description: Total amount
 *                 example: 15999.50
 *               remarks:
 *                 type: string
 *                 description: Remarks
 *                 example: "Received"
 *               stockId:
 *                 type: integer
 *                 description: Stock ID
 *                 example: 1
 *               grnDetails:
 *                 type: array
 *                 description: GRN details
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantityReceived
 *                     - unitCost
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       description: Product ID
 *                       example: 1
 *                     quantityReceived:
 *                       type: integer
 *                       description: Quantity received
 *                       example: 10
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
 *         description: GRN created successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: GRN number already exists
 *       500:
 *         description: Internal server error
 */

// POST - Create complete GRN with details
export async function POST(request: NextRequest) {
  console.log(' GRN POST request started');
  
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

    const employeeId = await getEmployeeIdFromSession(request)
    
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid session - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    console.log(' Access token verified, employee ID:', employeeId);

    const body = await request.json()
    
    console.log(' Received complete GRN data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const { grnNumber, supplierId, receivedDate, totalAmount, remarks, stockId, grnDetails } = body
    
    console.log(' Received data:', { grnNumber, supplierId, receivedDate, totalAmount, remarks, stockId });
    console.log(' Using employee ID:', employeeId);

    if (!grnNumber || !supplierId || !receivedDate) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'GRN number, supplier ID, and received date are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate GRN details
    if (!grnDetails || !Array.isArray(grnDetails) || grnDetails.length === 0) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'At least one GRN detail is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate each GRN detail
    for (let i = 0; i < grnDetails.length; i++) {
      const detail = grnDetails[i];
      if (!detail.productId || !detail.quantityReceived || !detail.unitCost) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: `GRN detail ${i + 1}: Product ID, quantity received, and unit cost are required`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    try {
      // Start transaction for creating complete GRN
      const result = await prisma.$transaction(async (tx) => {
        console.log(' Starting transaction for complete GRN creation');

        // Check if GRN number already exists
        const existingGrn = await tx.grn.findFirst({
          where: {
            grnNumber
          }
        })

        if (existingGrn) {
          throw new Error('GRN number already exists')
        }

        // Check if supplier exists
        const existingSupplier = await tx.supplier.findFirst({
          where: {
            supplierId: parseInt(supplierId),
            deletedAt: null
          }
        })

        if (!existingSupplier) {
          throw new Error('Invalid supplier ID')
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
            console.warn(` Stock ID ${stockId} not found, creating GRN without stock reference`);
            validatedStockId = null;
          } else {
            validatedStockId = parseInt(stockId);
          }
        }

        // Create GRN
        const grnData = {
          grnNumber,
          supplierId: parseInt(supplierId),
          employeeId,
          receivedDate: new Date(receivedDate),
          totalAmount: totalAmount ? parseFloat(totalAmount.toString()) : 0,
          remarks: remarks || null,
          stockId: validatedStockId,
          createdDate: new Date(),
          updatedDate: new Date()
        }

        console.log(' Creating GRN with data:', grnData);

        const createdGrn = await tx.grn.create({
          data: grnData,
          select: {
            grnId: true,
            grnNumber: true,
            supplierId: true,
            employeeId: true,
            receivedDate: true,
            totalAmount: true,
            remarks: true,
            stockId: true,
            createdDate: true,
            updatedDate: true,
          }
        })

        console.log(' Created GRN:', createdGrn);

        // Create GRN Details
        const createdDetails = []
        let calculatedTotalAmount = 0

        for (const detail of grnDetails) {
          console.log(' Processing GRN detail:', detail);

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
          const qty = parseInt(detail.quantityReceived)
          const cost = parseFloat(detail.unitCost.toString())
          const subTotal = qty * cost
          calculatedTotalAmount += subTotal

          const detailData = {
            grnId: createdGrn.grnId,
            productId: parseInt(detail.productId),
            quantityReceived: qty,
            unitCost: cost,
            subTotal: subTotal,
            location: detail.location ? detail.location.toString() : null
          }

          console.log(' Creating GRN detail with data:', detailData);

          const createdDetail = await tx.grndetails.create({
            data: detailData,
            select: {
              grnDetailId: true,
              grnId: true,
              productId: true,
              quantityReceived: true,
              unitCost: true,
              subTotal: true,
              location: true,
            }
          })

          console.log(' Created GRN detail:', createdDetail);

          // Transform detail for response
          const transformedDetail = {
            grnDetailId: createdDetail.grnDetailId,
            grnId: createdDetail.grnId,
            productId: createdDetail.productId,
            quantityReceived: createdDetail.quantityReceived,
            unitCost: createdDetail.unitCost ? parseFloat(createdDetail.unitCost.toString()) : 0,
            subTotal: createdDetail.subTotal ? parseFloat(createdDetail.subTotal.toString()) : 0,
            location: createdDetail.location
          }

          createdDetails.push(transformedDetail)
        }

        // Update GRN with calculated total amount if not provided
        if (!totalAmount) {
          const updatedGrn = await tx.grn.update({
            where: {
              grnId: createdGrn.grnId
            },
            data: {
              totalAmount: calculatedTotalAmount,
              updatedDate: new Date()
            },
            select: {
              grnId: true,
              grnNumber: true,
              supplierId: true,
              employeeId: true,
              receivedDate: true,
              totalAmount: true,
              remarks: true,
              stockId: true,
              createdDate: true,
              updatedDate: true,
            }
          })

          console.log(' Updated GRN with calculated total amount:', updatedGrn);

          return {
            grn: updatedGrn,
            grnDetails: createdDetails,
            calculatedTotalAmount
          }
        }

        return {
          grn: createdGrn,
          grnDetails: createdDetails,
          calculatedTotalAmount
        }
      })

      // Transform GRN response
      const transformedGrn = {
        grnId: result.grn.grnId,
        grnNumber: result.grn.grnNumber,
        supplierId: result.grn.supplierId,
        stockKeeperId: result.grn.employeeId,
        receivedDate: result.grn.receivedDate?.toISOString().split('T')[0],
        totalAmount: result.grn.totalAmount ? parseFloat(result.grn.totalAmount.toString()) : 0,
        remarks: result.grn.remarks,
        stockId: result.grn.stockId
      }

      const response = {
        status: 'success',
        code: 201,
        message: 'Complete GRN created successfully',
        timestamp: new Date().toISOString(),
        data: {
          grn: transformedGrn,
          grnDetails: result.grnDetails,
          totalDetailsCreated: result.grnDetails.length,
          calculatedTotalAmount: result.calculatedTotalAmount
        }
      };

      console.log(' Returning successful response:', JSON.stringify(response, null, 2));

      return NextResponse.json(response, { status: 201 })

    } catch (dbError) {
      console.error(' Database error:', dbError)
      
      // Handle specific error cases
      if (dbError instanceof Error) {
        if (dbError.message === 'GRN number already exists') {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'GRN number already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }

        if (dbError.message === 'Invalid supplier ID') {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Invalid supplier ID',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
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
          message: 'Failed to create complete GRN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN POST error:', error)
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
 * /api/grn:
 *   put:
 *     tags:
 *       - GRN
 *     summary: Update GRN
 *     description: Update a specific GRN record
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: GRN ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grnNumber:
 *                 type: string
 *               supplierId:
 *                 type: integer
 *               receivedDate:
 *                 type: string
 *                 format: date
 *               totalAmount:
 *                 type: number
 *               remarks:
 *                 type: string
 *               stockId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: GRN updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN not found
 *       409:
 *         description: GRN number already exists
 *       500:
 *         description: Internal server error
 */

// PUT - Update GRN
export async function PUT(request: NextRequest) {
  console.log(' GRN PUT request started');
  
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

    const employeeId = await getEmployeeIdFromSession(request)
    
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid session - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    console.log(' Access token verified, employee ID:', employeeId);

    const { searchParams } = new URL(request.url)
    const grnIdParam = searchParams.get('id')
    const body = await request.json()

    if (!grnIdParam) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'GRN ID is required as query parameter',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const grnId = parseInt(grnIdParam)
    if (isNaN(grnId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid GRN ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.log(` Updating GRN ID: ${grnId}`, body);

    try {
      // Check if GRN exists
      const existingGrn = await prisma.grn.findUnique({
        where: {
          grnId: grnId
        }
      })

      if (!existingGrn) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GRN not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Check if GRN number already exists (excluding current GRN)
      if (body.grnNumber && body.grnNumber !== existingGrn.grnNumber) {
        const duplicateGrn = await prisma.grn.findFirst({
          where: {
            grnNumber: body.grnNumber,
            grnId: { not: grnId }
          }
        })

        if (duplicateGrn) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'GRN number already exists',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }

      // Check if supplier exists (if being updated)
      if (body.supplierId) {
        const existingSupplier = await prisma.supplier.findFirst({
          where: {
            supplierId: parseInt(body.supplierId),
            deletedAt: null
          }
        })

        if (!existingSupplier) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 400,
              message: 'Invalid supplier ID',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
      }

      // Validate stockId if provided
      let validatedStockId = existingGrn.stockId;
      if (body.stockId !== undefined) {
        if (body.stockId) {
          const existingStock = await prisma.stock.findUnique({
            where: {
              stockId: parseInt(body.stockId)
            }
          })

          if (!existingStock) {
            console.warn(` Stock ID ${body.stockId} not found, setting to null`);
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

      if (body.grnNumber !== undefined) updateData.grnNumber = body.grnNumber
      if (body.supplierId !== undefined) updateData.supplierId = parseInt(body.supplierId)
      if (body.receivedDate !== undefined) updateData.receivedDate = new Date(body.receivedDate)
      if (body.totalAmount !== undefined) updateData.totalAmount = parseFloat(body.totalAmount.toString())
      if (body.remarks !== undefined) updateData.remarks = body.remarks
      if (body.stockId !== undefined) updateData.stockId = validatedStockId

      console.log(' Update data:', updateData);

      // Update GRN
      const grn = await prisma.grn.update({
        where: {
          grnId: grnId
        },
        data: updateData,
        select: {
          grnId: true,
          grnNumber: true,
          supplierId: true,
          employeeId: true,
          receivedDate: true,
          totalAmount: true,
          remarks: true,
          createdDate: true,
          updatedDate: true,
          stockId: true,
        }
      })

      console.log(' GRN updated:', grn);

      // Transform response
      const transformedGrn = {
        grnId: grn.grnId,
        grnNumber: grn.grnNumber,
        supplierId: grn.supplierId,
        stockKeeperId: grn.employeeId,
        receivedDate: grn.receivedDate?.toISOString().split('T')[0],
        totalAmount: grn.totalAmount ? parseFloat(grn.totalAmount.toString()) : 0,
        remarks: grn.remarks,
        stockId: grn.stockId,
        createdAt: grn.createdDate?.toISOString(),
        updatedAt: grn.updatedDate?.toISOString()
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GRN updated successfully',
          timestamp: new Date().toISOString(),
          data: transformedGrn
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update GRN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN PUT error:', error)
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
 * /api/grn:
 *   delete:
 *     tags:
 *       - GRN
 *     summary: Delete GRN
 *     description: Delete a specific GRN record and all related details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: GRN ID
 *     responses:
 *       200:
 *         description: GRN deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: GRN not found
 *       500:
 *         description: Internal server error
 */

// DELETE - Delete GRN
export async function DELETE(request: NextRequest) {
  console.log(' GRN DELETE request started');
  
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

    console.log(' Session verified');

    const { searchParams } = new URL(request.url)
    const grnIdParam = searchParams.get('id')

    if (!grnIdParam) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'GRN ID is required as query parameter',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const grnId = parseInt(grnIdParam)
    if (isNaN(grnId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid GRN ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.log(` Deleting GRN ID: ${grnId}`);

    try {
      // Check if GRN exists
      const existingGrn = await prisma.grn.findUnique({
        where: {
          grnId: grnId
        }
      })

      if (!existingGrn) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'GRN not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Delete GRN and related details in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete related GRN details first
        console.log(' Deleting related GRN details...');
        await tx.grndetails.deleteMany({
          where: {
            grnId: grnId
          }
        })

        // Delete the GRN
        console.log(' Deleting GRN...');
        await tx.grn.delete({
          where: {
            grnId: grnId
          }
        })
      })

      console.log(' GRN and related details deleted successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'GRN deleted successfully',
          timestamp: new Date().toISOString(),
          data: null
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete GRN',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' GRN DELETE error:', error)
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