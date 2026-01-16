import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedSession } from '@/lib/api-auth-optimized'

/**
 * @swagger
 * /api/logs:
 *   get:
 *     tags:
 *       - Transaction Logs
 *     summary: Get all transaction logs
 *     description: Retrieve all transaction log records with pagination, sorting, search, and filtering
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
 *           default: "actionDate"
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
 *         name: stockKeeperId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityName
 *         schema:
 *           type: string
 *       - in: query
 *         name: referenceId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 */

// GET - Retrieve all transaction logs with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Transaction Logs GET request started');
  
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
const authResult = await getAuthenticatedSession(request)
if (authResult.error) {
  return authResult.response
}

console.log(' Access token verified');

    const { searchParams } = new URL(request.url)

    // Parse query parameters with defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')))
    const sortBy = searchParams.get('sortBy') || 'actionDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const stockKeeperId = searchParams.get('stockKeeperId')
    const actionType = searchParams.get('actionType')
    const entityName = searchParams.get('entityName')
    const referenceId = searchParams.get('referenceId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    console.log(' Query parameters:', { 
      page, limit, sortBy, sortOrder, search, 
      stockKeeperId, actionType, entityName, referenceId, dateFrom, dateTo
    });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where conditions
    const where: any = {}

    // Apply filters
    if (stockKeeperId) {
      where.employeeId = parseInt(stockKeeperId)
    }

    if (actionType) {
      where.actionType = actionType
    }

    if (entityName) {
      where.entityName = entityName
    }

    if (referenceId) {
      where.referenceId = parseInt(referenceId)
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.actionDate = {}
      if (dateFrom) {
        where.actionDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        where.actionDate.lt = endDate
      }
    }

    // Search filter - search in action type, entity name, old value, new value
    if (search) {
      where.OR = [
        { actionType: { contains: search, mode: 'insensitive' } },
        { entityName: { contains: search, mode: 'insensitive' } },
        { oldValue: { contains: search, mode: 'insensitive' } },
        { newValue: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Valid sort columns
    const validSortColumns = [
      'logId', 'employeeId', 'actionType', 'entityName', 'referenceId', 'actionDate'
    ]
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'actionDate'
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where conditions:', JSON.stringify(where, null, 2));
    console.log(' Sort by:', sortColumn, sortDirection);

    try {
      // Get transaction logs with counts - include related data
      const [transactionLogs, totalCount] = await Promise.all([
        prisma.transactionlog.findMany({
          where,
          orderBy: {
            [sortColumn]: sortDirection
          },
          skip: offset,
          take: limit,
          include: {
            employees: {
              select: {
                UserName: true,
                Email: true,
                Phone: true
              }
            }
          }
        }),
        prisma.transactionlog.count({ where })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      console.log(` Found ${transactionLogs.length} transaction logs out of ${totalCount} total`);

      // Transform data for response
      const transformedLogs = transactionLogs.map(log => ({
        logId: log.logId,
        stockKeeperId: log.employeeId,
        actionType: log.actionType,
        entityName: log.entityName,
        referenceId: log.referenceId,
        actionDate: log.actionDate?.toISOString() || new Date().toISOString(),
        oldValue: log.oldValue,
        newValue: log.newValue,
        // Include related data for better display
        stockKeeperName: log.employees?.UserName,
        stockKeeperEmail: log.employees?.Email,
        stockKeeperPhone: log.employees?.Phone
      }))

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Transaction logs retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedLogs,
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
              stockKeeperId: stockKeeperId ? parseInt(stockKeeperId) : null,
              actionType: actionType || null,
              entityName: entityName || null,
              referenceId: referenceId ? parseInt(referenceId) : null,
              dateFrom: dateFrom || null,
              dateTo: dateTo || null
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
          message: 'Failed to retrieve transaction logs - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Transaction Logs GET error:', error)
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