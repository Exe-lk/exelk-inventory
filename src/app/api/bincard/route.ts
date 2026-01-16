import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedSession } from '@/lib/api-auth-optimized'

/**
 * @swagger
 * /api/bincard:
 *   get:
 *     tags:
 *       - BinCards
 *     summary: Get all bin cards
 *     description: Retrieve all bin card records with pagination, sorting, search, and filtering
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
 *           default: "transactionDate"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: variationId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [GRN, GIN]
 *       - in: query
 *         name: stockKeeperId
 *         schema:
 *           type: integer
 */

// GET - Retrieve all bin cards with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' BinCards GET request started');
  
  try {
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }

    console.log(' Session verified');

    const { searchParams } = new URL(request.url)

    // Parse query parameters with defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')))
    const sortBy = searchParams.get('sortBy') || 'transactionDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const variationId = searchParams.get('variationId')
    const transactionType = searchParams.get('transactionType')
    const stockKeeperId = searchParams.get('stockKeeperId')

    console.log(' Query parameters:', { 
      page, limit, sortBy, sortOrder, search, 
      variationId, transactionType, stockKeeperId 
    });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where conditions
    const where: any = {}

    // Apply filters
    if (variationId) {
      where.variationId = parseInt(variationId)
    }

    if (transactionType && ['GRN', 'GIN'].includes(transactionType)) {
      where.transactionType = transactionType
    }

    if (stockKeeperId) {
      where.employeeId = parseInt(stockKeeperId)
    }

    // Search filter - search in remarks and transaction type
    if (search) {
      where.OR = [
        { remarks: { contains: search, mode: 'insensitive' } },
        { transactionType: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Valid sort columns
    const validSortColumns = [
      'bincardId', 'variationId', 'transactionDate', 'transactionType', 
      'referenceId', 'quantityIn', 'quantityOut', 'balance', 'employeeId'
    ]
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'transactionDate'
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where conditions:', JSON.stringify(where, null, 2));
    console.log(' Sort by:', sortColumn, sortDirection);

    try {
      // Get bin cards with counts - include related data
      const [binCards, totalCount] = await Promise.all([
        prisma.bincard.findMany({
          where,
          orderBy: {
            [sortColumn]: sortDirection
          },
          skip: offset,
          take: limit,
          include: {
            productvariation: {
              select: {
                variationName: true,
                color: true,
                size: true,
                capacity: true,
                version: {
                  select: {
                    product: {
                      select: {
                        productName: true,
                        sku: true,
                        brand: {
                          select: {
                            brandName: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            employees: {
              select: {
                UserName: true,
                Email: true
              }
            }
          }
        }),
        prisma.bincard.count({ where })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      console.log(` Found ${binCards.length} bin cards out of ${totalCount} total`);

      // Transform data for response
      const transformedBinCards = binCards.map(binCard => ({
        binCardId: binCard.bincardId,
        variationId: binCard.variationId,
        transactionDate: binCard.transactionDate?.toISOString().split('T')[0], // Format as YYYY-MM-DD
        transactionType: binCard.transactionType,
        referenceId: binCard.referenceId,
        quantityIn: binCard.quantityIn || 0,
        quantityOut: binCard.quantityOut || 0,
        balance: binCard.balance || 0,
        stockKeeperId: binCard.employeeId,
        remarks: binCard.remarks,
        // Include related data for better display
        variationName: binCard.productvariation?.variationName,
        variationColor: binCard.productvariation?.color,
        variationSize: binCard.productvariation?.size,
        variationCapacity: binCard.productvariation?.capacity,
        productName: binCard.productvariation?.version?.product?.productName,
        productSku: binCard.productvariation?.version?.product?.sku,
        brandName: binCard.productvariation?.version?.product?.brand?.brandName,
        stockKeeperName: binCard.employees?.UserName,
        stockKeeperEmail: binCard.employees?.Email
      }))

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Bin cards retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedBinCards,
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
              variationId: variationId ? parseInt(variationId) : null,
              transactionType: transactionType || null,
              stockKeeperId: stockKeeperId ? parseInt(stockKeeperId) : null
            }
          }
        },
        { status: 200 ,
          headers: {
            'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' // Cache for 60 seconds, allow stale for 120 seconds
          }
        }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve bin cards - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' BinCards GET error:', error)
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
 * /api/bincards:
 *   post:
 *     tags:
 *       - BinCards
 *     summary: Create bin card entry
 *     description: Create a new bin card entry
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variationId
 *               - transactionDate
 *               - transactionType
 *               - balance
 *               - stockKeeperId
 *             properties:
 *               variationId:
 *                 type: integer
 *               transactionDate:
 *                 type: string
 *                 format: date
 *               transactionType:
 *                 type: string
 *                 enum: [GRN, GIN]
 *               referenceId:
 *                 type: integer
 *               quantityIn:
 *                 type: integer
 *               quantityOut:
 *                 type: integer
 *               balance:
 *                 type: integer
 *               stockKeeperId:
 *                 type: integer
 *               remarks:
 *                 type: string
 */

// POST - Create a new bin card entry
export async function POST(request: NextRequest) {
  console.log(' BinCards POST request started');
  
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

const employeeId = authResult.employeeId
console.log(' Access token verified, employee ID:', employeeId);

    const body = await request.json()
    console.log(' Request body:', body);

    // Validate required fields
    const { 
      variationId, 
      transactionDate, 
      transactionType, 
      referenceId, 
      quantityIn = 0, 
      quantityOut = 0, 
      balance, 
      stockKeeperId, 
      remarks 
    } = body

    if (!variationId || !transactionDate || !transactionType || balance === undefined || !stockKeeperId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Missing required fields: variationId, transactionDate, transactionType, balance, stockKeeperId',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate transaction type
    if (!['GRN', 'GIN'].includes(transactionType)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Transaction type must be either GRN or GIN',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verify variation exists
        const variation = await tx.productvariation.findUnique({
          where: { variationId: parseInt(variationId) }
        });

        if (!variation) {
          throw new Error(`Product variation with ID ${variationId} not found`);
        }

        // Verify employee exists
        const employee = await tx.employees.findUnique({
          where: { EmployeeID: parseInt(stockKeeperId) }
        });

        if (!employee) {
          throw new Error(`Employee with ID ${stockKeeperId} not found`);
        }

        // Create bin card entry
        const binCard = await tx.bincard.create({
          data: {
            variationId: parseInt(variationId),
            transactionDate: new Date(transactionDate),
            transactionType,
            referenceId: referenceId ? parseInt(referenceId) : null,
            quantityIn: quantityIn || null,
            quantityOut: quantityOut || null,
            balance: parseInt(balance),
            employeeId: parseInt(stockKeeperId),
            remarks: remarks || null
          }
        })

        return binCard
      })

      console.log(' Bin card created successfully:', result.bincardId);

      return NextResponse.json(
        {
          status: 'success',
          code: 201,
          message: 'Bin card entry created successfully',
          timestamp: new Date().toISOString(),
          data: {
            binCardId: result.bincardId,
            variationId: result.variationId,
            transactionDate: result.transactionDate?.toISOString().split('T')[0],
            transactionType: result.transactionType,
            referenceId: result.referenceId,
            quantityIn: result.quantityIn || 0,
            quantityOut: result.quantityOut || 0,
            balance: result.balance || 0,
            stockKeeperId: result.employeeId,
            remarks: result.remarks
          }
        },
        { status: 201 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: dbError instanceof Error ? dbError.message : 'Failed to create bin card entry',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' BinCards POST error:', error)
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