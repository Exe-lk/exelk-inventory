import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'

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

// Generate GRN number
function generateGrnNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `GRN-${year}${month}${day}-${timestamp}`;
}

// Generate GIN number
function generateGinNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `GIN-${year}${month}${day}-${timestamp}`;
}

/**
 * @swagger
 * /api/stock:
 *   get:
 *     tags:
 *       - Stock
 *     summary: Get all stocks
 *     description: Retrieve all stock records with pagination, sorting, search, and filtering
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "stockId"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "asc"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: variationId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 */

// GET - Retrieve stocks with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Stock GET request started');
  
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

    console.log(' Access token verified');

    const { searchParams } = new URL(request.url)

    // Parse query parameters with defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')))
    const sortBy = searchParams.get('sortBy') || 'stockId'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const productId = searchParams.get('productId')
    const versionId = searchParams.get('versionId')// added
    const variationId = searchParams.get('variationId')
    const lowStock = searchParams.get('lowStock')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, productId, variationId, lowStock });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where conditions
    const where: any = {}

    // Apply filters
    if (productId) {
      where.productId = parseInt(productId)
    }

     if (versionId) {
    where.versionId = parseInt(versionId)
  }

    if (variationId) {
      where.variationId = parseInt(variationId)
    }

    // Search filter - search in location and related product data
    if (search) {
      where.OR = [
        { location: { contains: search, mode: 'insensitive' } },
        { 
          product: { 
            productName: { contains: search, mode: 'insensitive' } 
          } 
        },
        { 
          product: { 
            sku: { contains: search, mode: 'insensitive' } 
          } 
        }
      ]
    }

    // Low stock filter - where quantity available is less than or equal to reorder level
    if (lowStock === 'true') {
      where.AND = [
        { quantityAvailable: { not: null } },
        { reorderLevel: { not: null } },
        {
          OR: [
            { quantityAvailable: { lte: { reorderLevel: true } } },
            { quantityAvailable: 0 }
          ]
        }
      ]
    }

    // Valid sort columns
    const validSortColumns = ['stockId', 'productId', 'quantityAvailable', 'reorderLevel', 'lastUpdatedDate', 'variationId']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'stockId'
    const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc'

    console.log(' Where conditions:', JSON.stringify(where, null, 2));
    console.log(' Sort by:', sortColumn, sortDirection);

    try {
      

    const [stocks, totalCount] = await Promise.all([
      prisma.stock.findMany({
        where,
        orderBy: {
          [sortColumn]: sortDirection
        },
        skip: offset,
        take: limit,
        select: {
          stockId: true,
          productId: true,
          variationId: true,
          quantityAvailable: true,
          reorderLevel: true,
          lastUpdatedDate: true,
          location: true,
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
      }),
      prisma.stock.count({ where })
    ])

      const totalPages = Math.ceil(totalCount / limit)

      console.log(` Found ${stocks.length} stocks out of ${totalCount} total`);

      // Transform data for response
      const transformedStocks = stocks.map(stock => ({
        stockId: stock.stockId,
        productId: stock.productId,
        variationId: stock.variationId,
        quantityAvailable: stock.quantityAvailable || 0,
        reorderLevel: stock.reorderLevel || 0,
        lastUpdatedDate: stock.lastUpdatedDate?.toISOString() || new Date().toISOString(),
        location: stock.location,
        // Include related data for better display
        productName: stock.product?.productName,
        productSku: stock.product?.sku,
        brandName: stock.product?.brand?.brandName,
        categoryName: stock.product?.category?.categoryName,
        variationName: stock.productvariation?.variationName,
        variationColor: stock.productvariation?.color,
        variationSize: stock.productvariation?.size,
        variationCapacity: stock.productvariation?.capacity
      }))

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Stocks retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedStocks,
            pagination: {
              totalItems: totalCount,
              page,
              limit,
              totalPages
            },
            sorting: {
              sortBy: sortColumn,
              sortOrder: sortDirection
            },
            search: search || null,
            filters: {
              productId: productId ? parseInt(productId) : null,
              variationId: variationId ? parseInt(variationId) : null,
              lowStock: lowStock === 'true'
            }
          }
        },
        { status: 200 ,
          headers: {
          'Cache-Control': 'private, max-age=60' // Cache for 60 seconds
    }}
      )

    } catch (dbError) {
      console.error(' Database error:', dbError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve stocks - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Stock GET error:', error)
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
 * /api/stock:
 *   post:
 *     tags:
 *       - Stock
 *     summary: Create stock-in or stock-out
 *     description: Handle stock-in and stock-out operations with automatic bincard creation
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 title: Stock-In Request
 *                 required:
 *                   - supplierId
 *                   - receivedDate
 *                   - items
 *                 properties:
 *                   supplierId:
 *                     type: integer
 *                   receivedDate:
 *                     type: string
 *                     format: date
 *                   remarks:
 *                     type: string
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: integer
 *                         variationId:
 *                           type: integer
 *                         quantityReceived:
 *                           type: integer
 *                         unitCost:
 *                           type: number
 *                         location:
 *                           type: string
 *               - type: object
 *                 title: Stock-Out Request
 *                 required:
 *                   - issuedTo
 *                   - issueReason
 *                   - issueDate
 *                   - items
 *                 properties:
 *                   issuedTo:
 *                     type: string
 *                   issueReason:
 *                     type: string
 *                   issueDate:
 *                     type: string
 *                     format: date
 *                   remarks:
 *                     type: string
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: integer
 *                         variationId:
 *                           type: integer
 *                         quantityIssued:
 *                           type: integer
 *                         unitCost:
 *                           type: number
 *                         location:
 *                           type: string
 */

// POST - Create Stock-In or Stock-Out
export async function POST(request: NextRequest) {
  console.log(' Stock POST request started');
  
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
          message: 'Invalid access token - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    console.log(' Access token verified, employee ID:', employeeId);

    const body = await request.json()
    console.log(' Request body:', body);

    // Determine if this is stock-in or stock-out based on the presence of certain fields
    const isStockIn = 'supplierId' in body && 'receivedDate' in body
    const isStockOut = 'issuedTo' in body && 'issueReason' in body && 'issueDate' in body

    if (isStockIn) {
      return await handleStockIn(body, employeeId)
    } else if (isStockOut) {
      return await handleStockOut(body, employeeId)
    } else {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid request: must be either stock-in or stock-out operation',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error(' Stock POST error:', error)
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

// Handle Stock-In operation
async function handleStockIn(body: any, employeeId: number) {
  const { supplierId, receivedDate, remarks, items } = body

  // Validation
  if (!supplierId || !receivedDate || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { 
        status: 'error',
        code: 400,
        message: 'Missing required fields: supplierId, receivedDate, items',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    )
  }

  try {
    // Pre-validate all data OUTSIDE the transaction to reduce transaction time
    console.log(' Pre-validating data before transaction...');
    
    // Validate supplier exists (outside transaction)
    const supplier = await prisma.supplier.findUnique({
      where: { 
        supplierId: parseInt(supplierId),
        deletedAt: null
      }
    });

    if (!supplier) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: `Supplier with ID ${supplierId} not found`,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // OPTIMIZATION: Validate all items with batch queries instead of N queries
    // First validate basic structure
    for (const item of items) {
      if (!item.productId || !item.quantityReceived || item.quantityReceived <= 0 || !item.unitCost) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Each item must have productId, quantityReceived (> 0), and unitCost',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Collect all product IDs and variation IDs
    const productIds = items
      .map(item => item.productId)
      .filter((id): id is number => id !== undefined && id !== null);
    
    const variationIds = items
      .map(item => item.variationId)
      .filter((id): id is number => id !== undefined && id !== null);

    // Fetch all products in ONE query instead of N queries
    const products = await prisma.product.findMany({
      where: {
        productId: { in: productIds },
        deletedAt: null
      }
    });

    // Fetch all variations in ONE query instead of N queries (if any variations exist)
    const variations = variationIds.length > 0
      ? await prisma.productvariation.findMany({
          where: {
            variationId: { in: variationIds }
          }
        })
      : [];

    // Create maps for O(1) lookup
    const productMap = new Map(
      products.map(p => [p.productId, p])
    );

    const variationMap = new Map(
      variations.map(v => [v.variationId, v])
    );

    // Now validate using the maps (no database queries in loop)
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: `Product with ID ${item.productId} not found`,
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Verify variation exists if provided
      if (item.variationId) {
        const variation = variationMap.get(item.variationId);
        if (!variation) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 404,
              message: `Product variation with ID ${item.variationId} not found`,
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          )
        }
      }
    }

    console.log(' Pre-validation completed. Starting transaction...');

    // Now execute the optimized transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate GRN number
      const grnNumber = generateGrnNumber()

      // Calculate total amount
      const totalAmount = items.reduce((sum: number, item: any) => 
        sum + (item.quantityReceived * item.unitCost), 0)

      // Create GRN (single operation)
      const grn = await tx.grn.create({
        data: {
          grnNumber,
          supplierId: parseInt(supplierId),
          employeeId,
          receivedDate: new Date(receivedDate),
          totalAmount,
          remarks: remarks || null,
          createdDate: new Date(),
          updatedDate: new Date()
        }
      })

      console.log(` Created GRN: ${grnNumber}`);

      // OPTIMIZATION: Fetch all stocks needed for transaction in ONE query
      // Collect all product/variation combinations
      const stockQueries = items.map(item => ({
        productId: item.productId,
        variationId: item.variationId || null
      }));

      // Fetch all existing stocks in ONE query inside transaction
      const existingStocks = await tx.stock.findMany({
        where: {
          OR: stockQueries.map(sq => ({
            productId: sq.productId,
            variationId: sq.variationId
          }))
        }
      });

      // Create a map for O(1) lookup
      const stockMap = new Map(
        existingStocks.map(s => [`${s.productId}-${s.variationId || 'null'}`, s])
      );

      // Process items sequentially to avoid race conditions
      const grnDetails = []
      const stockUpdates = []
      const binCardEntries = []
      const transactionLogEntries = []

      for (const item of items) {
        console.log(` Processing item: Product ${item.productId}, Qty: ${item.quantityReceived}`);

        // 1. Create GRN detail
        const grnDetail = await tx.grndetails.create({
          data: {
            grnId: grn.grnId,
            productId: item.productId,
            quantityReceived: item.quantityReceived,
            unitCost: item.unitCost,
            subTotal: item.quantityReceived * item.unitCost,
            location: item.location || null
          }
        })
        grnDetails.push(grnDetail)

        // 2. Use the stock map instead of querying database
        const stockKey = `${item.productId}-${item.variationId || 'null'}`;
        const existingStock = stockMap.get(stockKey);

        let stockUpdate
        let finalBalance

        if (existingStock) {
          // Update existing stock
          const quantityBefore = existingStock.quantityAvailable || 0
          const quantityAfter = quantityBefore + item.quantityReceived
          finalBalance = quantityAfter

          await tx.stock.update({
            where: { stockId: existingStock.stockId },
            data: {
              quantityAvailable: quantityAfter,
              lastUpdatedDate: new Date(),
              location: item.location || existingStock.location
            }
          })

          stockUpdate = {
            stockId: existingStock.stockId,
            productId: item.productId,
            variationId: item.variationId || null,
            quantityBefore,
            quantityAfter,
            action: 'updated'
          }

          console.log(` Updated existing stock: ${quantityBefore} → ${quantityAfter}`);
        } else {
          // Create new stock entry
          const newStock = await tx.stock.create({
            data: {
              productId: item.productId,
              variationId: item.variationId || null,
              quantityAvailable: item.quantityReceived,
              reorderLevel: 10, // Default reorder level
              lastUpdatedDate: new Date(),
              location: item.location || null
            }
          })

          finalBalance = item.quantityReceived
          stockUpdate = {
            stockId: newStock.stockId,
            productId: item.productId,
            variationId: item.variationId || null,
            quantityBefore: 0,
            quantityAfter: item.quantityReceived,
            action: 'created'
          }

          console.log(` Created new stock: 0 → ${item.quantityReceived}`);
        }
        stockUpdates.push(stockUpdate)

        // 3. Create Bin Card entry
        const binCardEntry = await tx.bincard.create({
          data: {
            variationId: item.variationId || null,
            transactionDate: new Date(receivedDate),
            transactionType: 'GRN',
            referenceId: grn.grnId,
            quantityIn: item.quantityReceived,
            quantityOut: null,
            balance: finalBalance,
            employeeId: employeeId,
            remarks: `GRN: ${grnNumber} - Stock In`
          }
        })
        binCardEntries.push(binCardEntry)

        // 4. Create Transaction Log entry
        const transactionLogEntry = await tx.transactionlog.create({
          data: {
            employeeId: employeeId,
            actionType: 'STOCK_IN',
            entityName: 'STOCK',
            referenceId: grn.grnId,
            actionDate: new Date(),
            oldValue: JSON.stringify({
              productId: item.productId,
              variationId: item.variationId || null,
              previousQuantity: stockUpdate.quantityBefore,
              location: existingStock?.location || null
            }),
            newValue: JSON.stringify({
              productId: item.productId,
              variationId: item.variationId || null,
              newQuantity: stockUpdate.quantityAfter,
              quantityAdded: item.quantityReceived,
              grnNumber: grnNumber,
              grnId: grn.grnId,
              location: item.location || existingStock?.location || null,
              unitCost: item.unitCost
            })
          }
        })
        transactionLogEntries.push(transactionLogEntry)
      }

      console.log(` Transaction completed. Processed ${items.length} items`);
      return { grn, grnDetails, stockUpdates, binCardEntries, transactionLogEntries }

    }, {
      //maxWait: 10000,  // Increased to 10 seconds
      //timeout: 15000,  // Increased to 15 seconds
      //isolationLevel: 'ReadCommitted' // Less strict isolation for better performance
    })

    // Successful response
    return NextResponse.json(
      {
        status: 'success',
        code: 201,
        message: 'Stock-in completed successfully',
        timestamp: new Date().toISOString(),
        data: {
          grnId: result.grn.grnId,
          grnNumber: result.grn.grnNumber,
          totalAmount: parseFloat(result.grn.totalAmount?.toString() || '0'),
          createdDate: result.grn.createdDate?.toISOString(),
          itemsProcessed: items.length,
          summary: {
            totalQuantityAdded: items.reduce((sum: number, item: any) => sum + item.quantityReceived, 0),
            totalValue: parseFloat(result.grn.totalAmount?.toString() || '0'),
            newStockEntries: result.stockUpdates.filter(s => s.action === 'created').length,
            updatedStockEntries: result.stockUpdates.filter(s => s.action === 'updated').length
          },
          details: result.grnDetails.map(detail => ({
            grnDetailId: detail.grnDetailId,
            productId: detail.productId,
            quantityReceived: detail.quantityReceived,
            unitCost: parseFloat(detail.unitCost?.toString() || '0'),
            subTotal: parseFloat(detail.subTotal?.toString() || '0'),
            location: detail.location
          })),
          stockUpdates: result.stockUpdates.map(update => ({
            stockId: update.stockId,
            productId: update.productId,
            variationId: update.variationId,
            quantityBefore: update.quantityBefore,
            quantityAfter: update.quantityAfter,
            quantityAdded: update.quantityAfter - update.quantityBefore,
            action: update.action
          })),
          binCardEntries: result.binCardEntries.map(entry => ({
            binCardId: entry.bincardId,
            variationId: entry.variationId,
            transactionType: entry.transactionType,
            quantityIn: entry.quantityIn,
            balance: entry.balance,
            transactionDate: entry.transactionDate?.toISOString()
          })),
          auditTrail: {
            transactionLogCount: result.transactionLogEntries.length,
            binCardCount: result.binCardEntries.length,
            employeeId: employeeId,
            processedAt: new Date().toISOString()
          }
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error(' Stock-in error:', error)
    
    // Enhanced error handling with more specific error messages
    let errorMessage = 'Failed to process stock-in'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('Supplier') && error.message.includes('not found')) {
        statusCode = 404
        errorMessage = error.message
      } else if (error.message.includes('Product') && error.message.includes('not found')) {
        statusCode = 404
        errorMessage = error.message
      } else if (error.message.includes('variation') && error.message.includes('not found')) {
        statusCode = 404
        errorMessage = error.message
      } else if (error.message.includes('Transaction')) {
        statusCode = 500
        errorMessage = 'Database transaction error. Please try again.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { 
        status: 'error',
        code: statusCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? {
          type: error.constructor.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : undefined
      },
      { status: statusCode }
    )
  }
}

// Handle Stock-Out operation
async function handleStockOut(body: any, employeeId: number) {
  const { issuedTo, issueReason, issueDate, remarks, items } = body

  // Validation
  if (!issuedTo || !issueReason || !issueDate || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { 
        status: 'error',
        code: 400,
        message: 'Missing required fields: issuedTo, issueReason, issueDate, items',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    )
  }

  try {
    // OPTIMIZATION: Pre-validate all data OUTSIDE the transaction
    console.log(' Pre-validating data before transaction...');

    // Validate basic structure first
    for (const item of items) {
      if (!item.productId || !item.quantityIssued || item.quantityIssued <= 0 || !item.unitCost) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Each item must have productId, quantityIssued (> 0), and unitCost',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Collect all product IDs and variation IDs
    const productIds = items
      .map(item => item.productId)
      .filter((id): id is number => id !== undefined && id !== null);
    
    const variationIds = items
      .map(item => item.variationId)
      .filter((id): id is number => id !== undefined && id !== null);

    // Fetch all products in ONE query
    const products = await prisma.product.findMany({
      where: {
        productId: { in: productIds },
        deletedAt: null
      }
    });

    // Fetch all variations in ONE query (if any variations exist)
    const variations = variationIds.length > 0
      ? await prisma.productvariation.findMany({
          where: {
            variationId: { in: variationIds }
          }
        })
      : [];

    // Create maps for O(1) lookup
    const productMap = new Map(
      products.map(p => [p.productId, p])
    );

    const variationMap = new Map(
      variations.map(v => [v.variationId, v])
    );

    // Validate products and variations
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: `Product with ID ${item.productId} not found`,
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      if (item.variationId) {
        const variation = variationMap.get(item.variationId);
        if (!variation) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 404,
              message: `Product variation with ID ${item.variationId} not found`,
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          )
        }
      }
    }

    // Collect all product/variation combinations for stock validation
    const stockQueries = items.map(item => ({
      productId: item.productId,
      variationId: item.variationId || null
    }));

    // Fetch all existing stocks in ONE query for pre-validation
    const existingStocks = await prisma.stock.findMany({
      where: {
        OR: stockQueries.map(sq => ({
          productId: sq.productId,
          variationId: sq.variationId
        }))
      }
    });

    // Create a map for O(1) lookup
    const stockMap = new Map(
      existingStocks.map(s => [`${s.productId}-${s.variationId || 'null'}`, s])
    );

    // Pre-validate stock availability
    for (const item of items) {
      const stockKey = `${item.productId}-${item.variationId || 'null'}`;
      const existingStock = stockMap.get(stockKey);

      if (!existingStock) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: `No stock found for product ID ${item.productId}`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      const availableQuantity = existingStock.quantityAvailable || 0;
      if (availableQuantity < item.quantityIssued) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: `Insufficient stock for product ID ${item.productId}. Available: ${availableQuantity}, Required: ${item.quantityIssued}`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    console.log(' Pre-validation completed. Starting transaction...');

    const result = await prisma.$transaction(async (tx) => {
      // Generate GIN number
      const ginNumber = generateGinNumber()

      //1. Create GIN
      const gin = await tx.gin.create({
        data: {
          ginNumber,
          employeeId,
          issuedTo,
          issueReason,
          issueDate: new Date(issueDate),
          remarks: remarks || null,
          createdDate: new Date(),
          updatedDate: new Date()
        }
      })

      // OPTIMIZATION: Fetch all stocks needed for transaction in ONE query
      // Re-fetch stocks within transaction to ensure we have the latest data
      const transactionStocks = await tx.stock.findMany({
        where: {
          OR: stockQueries.map(sq => ({
            productId: sq.productId,
            variationId: sq.variationId
          }))
        }
      });

      // Create stock map for transaction
      const transactionStockMap = new Map(
        transactionStocks.map(s => [`${s.productId}-${s.variationId || 'null'}`, s])
      );

      // Process each item
      const ginDetails = []
      const stockUpdates = []
      const binCardEntries = []
      const transactionLogEntries = []

      for (const item of items) {
        // Use the stock map instead of querying database
        const stockKey = `${item.productId}-${item.variationId || 'null'}`;
        const existingStock = transactionStockMap.get(stockKey);

        if (!existingStock) {
          throw new Error(`No stock found for product ID ${item.productId}`);
        }

        const availableQuantity = existingStock.quantityAvailable || 0;
        if (availableQuantity < item.quantityIssued) {
          throw new Error(`Insufficient stock for product ID ${item.productId}. Available: ${availableQuantity}, Required: ${item.quantityIssued}`);
        }

        //3. Create GIN detail
        const ginDetail = await tx.gindetails.create({
          data: {
            ginId: gin.ginId,
            productId: item.productId,
            quantityIssued: item.quantityIssued,
            unitCost: item.unitCost,
            subTotal: item.quantityIssued * item.unitCost,
            location: item.location || null
          }
        })
        ginDetails.push(ginDetail)

        // Update stock
        const quantityBefore = existingStock.quantityAvailable || 0
        const quantityAfter = quantityBefore - item.quantityIssued

        await tx.stock.update({
          where: { stockId: existingStock.stockId },
          data: {
            quantityAvailable: quantityAfter,
            lastUpdatedDate: new Date()
          }
        })

        const stockUpdate = {
          stockId: existingStock.stockId,
          productId: item.productId,
          variationId: item.variationId || null,
          quantityBefore,
          quantityAfter
        }
        stockUpdates.push(stockUpdate)

          // 4. Create Bin Card entry
        const binCardEntry = await tx.bincard.create({
          data: {
            variationId: item.variationId || null,
            transactionDate: new Date(issueDate),
            transactionType: 'GIN',
            referenceId: gin.ginId,
            quantityIn: null,
            quantityOut: item.quantityIssued,
            balance: quantityAfter,
            employeeId: employeeId,
            remarks: `GIN: ${ginNumber} - Stock Out to ${issuedTo}`
          }
        })
        binCardEntries.push(binCardEntry)

         // 5. Create Transaction Log entry
        const transactionLogEntry = await tx.transactionlog.create({
          data: {
            employeeId: employeeId,
            actionType: 'STOCK_OUT',
            entityName: 'STOCK',
            referenceId: gin.ginId,
            actionDate: new Date(),
            oldValue: JSON.stringify({
              productId: item.productId,
              variationId: item.variationId || null,
              previousQuantity: quantityBefore
            }),
            newValue: JSON.stringify({
              productId: item.productId,
              variationId: item.variationId || null,
              newQuantity: quantityAfter,
              quantityIssued: item.quantityIssued,
              ginNumber: ginNumber,
              ginId: gin.ginId,
              issuedTo: issuedTo,
              issueReason: issueReason
            })
          }
        })
        transactionLogEntries.push(transactionLogEntry)
      }

      return { gin, ginDetails, stockUpdates, binCardEntries, transactionLogEntries}
    })

    return NextResponse.json(
      {
        status: 'success',
        code: 201,
        message: 'Stock-out completed successfully',
        timestamp: new Date().toISOString(),
        data: {
          ginId: result.gin.ginId,
          ginNumber: result.gin.ginNumber,
          createdAt: result.gin.createdDate?.toISOString(),
          details: result.ginDetails.map(detail => ({
            ginDetailId: detail.ginDetailId,
            productId: detail.productId,
            quantityIssued: detail.quantityIssued,
            unitCost: parseFloat(detail.unitCost?.toString() || '0'),
            subTotal: parseFloat(detail.subTotal?.toString() || '0')
          })),
          stockUpdates: result.stockUpdates,
          binCardEntries: result.binCardEntries.map(entry => ({
            binCardId: entry.bincardId,
            variationId: entry.variationId,
            transactionType: entry.transactionType,
            quantityOut: entry.quantityOut,
            balance: entry.balance
          })),
          transactionLogCount: result.transactionLogEntries.length
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error(' Stock-out error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: error instanceof Error ? error.message : 'Failed to process stock-out',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}