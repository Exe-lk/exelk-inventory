import { prisma } from '@/lib/prisma/client'
import { 
  TransactionLog,
  TransactionLogWithDetails,
  CreateTransactionLogRequest,
  TransactionLogQueryParams,
  TransactionLogDBWithRelations,
  TransactionLogValidationResult,
  TransactionLogValidationError,
  StockTransactionData
} from '@/types/transactionlog'

export class TransactionLogService {
  
  /**
   * Get all transaction logs with pagination, sorting, search and filtering
   */
  static async getAllTransactionLogs(params: TransactionLogQueryParams) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'actionDate',
      sortOrder = 'desc',
      search = '',
      stockKeeperId,
      actionType,
      entityName,
      referenceId,
      dateFrom,
      dateTo
    } = params

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where conditions
    const where: any = {}

    // Apply filters
    if (stockKeeperId) {
      where.employeeId = stockKeeperId
    }

    if (actionType) {
      where.actionType = actionType
    }

    if (entityName) {
      where.entityName = entityName
    }

    if (referenceId) {
      where.referenceId = referenceId
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.actionDate = {}
      if (dateFrom) {
        where.actionDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.actionDate.lte = new Date(dateTo)
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

    try {
      // Get transaction logs with counts
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

      // Transform data
      const transformedLogs: TransactionLogWithDetails[] = transactionLogs.map(log => ({
        logId: log.logId,
        stockKeeperId: log.employeeId,
        actionType: log.actionType || '',
        entityName: log.entityName || '',
        referenceId: log.referenceId,
        actionDate: log.actionDate?.toISOString() || new Date().toISOString(),
        oldValue: log.oldValue,
        newValue: log.newValue,
        // Include related data
        stockKeeperName: log.employees?.UserName,
        stockKeeperEmail: log.employees?.Email
      }))

      return {
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
          stockKeeperId: stockKeeperId || null,
          actionType: actionType || null,
          entityName: entityName || null,
          referenceId: referenceId || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null
        }
      }

    } catch (error) {
      console.error('Error fetching transaction logs:', error)
      throw new Error(`Failed to fetch transaction logs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create new transaction log entry
   */
  static async createTransactionLog(data: CreateTransactionLogRequest): Promise<TransactionLog> {
    // Validate input
    const validation = this.validateCreateTransactionLogRequest(data)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verify employee exists
        const employee = await tx.employees.findUnique({
          where: { EmployeeID: data.stockKeeperId }
        });

        if (!employee) {
          throw new Error(`Employee with ID ${data.stockKeeperId} not found`);
        }

        // Prepare old and new values as strings
        const oldValueString = data.oldValue ? 
          (typeof data.oldValue === 'object' ? JSON.stringify(data.oldValue) : String(data.oldValue)) 
          : null;
        
        const newValueString = data.newValue ? 
          (typeof data.newValue === 'object' ? JSON.stringify(data.newValue) : String(data.newValue)) 
          : null;

        // Create transaction log entry
        const transactionLog = await tx.transactionlog.create({
          data: {
            employeeId: data.stockKeeperId,
            actionType: data.actionType,
            entityName: data.entityName,
            referenceId: data.referenceId || null,
            actionDate: new Date(),
            oldValue: oldValueString,
            newValue: newValueString
          }
        })

        return transactionLog
      })

      // Transform to response format
      const transformedLog: TransactionLog = {
        logId: result.logId,
        stockKeeperId: result.employeeId,
        actionType: result.actionType || '',
        entityName: result.entityName || '',
        referenceId: result.referenceId,
        actionDate: result.actionDate?.toISOString() || new Date().toISOString(),
        oldValue: result.oldValue,
        newValue: result.newValue
      }

      return transformedLog

    } catch (error) {
      console.error('Error creating transaction log:', error)
      throw error instanceof Error ? error : new Error('Failed to create transaction log')
    }
  }

  /**
   * Log stock transaction (for automatic logging during stock operations)
   */
  static async logStockTransaction(
    employeeId: number, 
    data: StockTransactionData
  ): Promise<TransactionLog[]> {
    try {
      const logs: TransactionLog[] = []

      if (data.operation === 'STOCK_IN' && data.grnId) {
        // Log GRN creation
        const grnLog = await this.createTransactionLog({
          stockKeeperId: employeeId,
          actionType: 'CREATE',
          entityName: 'GRN',
          referenceId: data.grnId,
          newValue: {
            operation: 'STOCK_IN',
            grnId: data.grnId,
            itemCount: data.items.length,
            totalQuantity: data.items.reduce((sum, item) => sum + item.quantity, 0)
          }
        })
        logs.push(grnLog)

        // Log individual stock updates
        for (const item of data.items) {
          const stockLog = await this.createTransactionLog({
            stockKeeperId: employeeId,
            actionType: 'STOCK_IN',
            entityName: 'STOCK',
            referenceId: item.productId,
            newValue: {
              productId: item.productId,
              variationId: item.variationId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              grnReference: data.grnId
            }
          })
          logs.push(stockLog)
        }
      }

      if (data.operation === 'STOCK_OUT' && data.ginId) {
        // Log GIN creation
        const ginLog = await this.createTransactionLog({
          stockKeeperId: employeeId,
          actionType: 'CREATE',
          entityName: 'GIN',
          referenceId: data.ginId,
          newValue: {
            operation: 'STOCK_OUT',
            ginId: data.ginId,
            itemCount: data.items.length,
            totalQuantity: data.items.reduce((sum, item) => sum + item.quantity, 0)
          }
        })
        logs.push(ginLog)

        // Log individual stock updates
        for (const item of data.items) {
          const stockLog = await this.createTransactionLog({
            stockKeeperId: employeeId,
            actionType: 'STOCK_OUT',
            entityName: 'STOCK',
            referenceId: item.productId,
            newValue: {
              productId: item.productId,
              variationId: item.variationId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              ginReference: data.ginId
            }
          })
          logs.push(stockLog)
        }
      }

      return logs

    } catch (error) {
      console.error('Error logging stock transaction:', error)
      throw new Error('Failed to log stock transaction')
    }
  }

  /**
   * Get transaction logs by employee ID
   */
  static async getTransactionLogsByEmployeeId(
    employeeId: number, 
    limit = 50
  ): Promise<TransactionLogWithDetails[]> {
    try {
      const transactionLogs = await prisma.transactionlog.findMany({
        where: { employeeId },
        orderBy: { actionDate: 'desc' },
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
      })

      return transactionLogs.map(log => ({
        logId: log.logId,
        stockKeeperId: log.employeeId,
        actionType: log.actionType || '',
        entityName: log.entityName || '',
        referenceId: log.referenceId,
        actionDate: log.actionDate?.toISOString() || new Date().toISOString(),
        oldValue: log.oldValue,
        newValue: log.newValue,
        stockKeeperName: log.employees?.UserName,
        stockKeeperEmail: log.employees?.Email
      }))

    } catch (error) {
      console.error(`Error fetching transaction logs for employee ${employeeId}:`, error)
      throw new Error('Failed to fetch transaction logs by employee ID')
    }
  }

  /**
   * Get transaction logs by entity and reference ID
   */
  static async getTransactionLogsByEntity(
    entityName: string,
    referenceId: number,
    limit = 20
  ): Promise<TransactionLogWithDetails[]> {
    try {
      const transactionLogs = await prisma.transactionlog.findMany({
        where: { 
          entityName,
          referenceId 
        },
        orderBy: { actionDate: 'desc' },
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
      })

      return transactionLogs.map(log => ({
        logId: log.logId,
        stockKeeperId: log.employeeId,
        actionType: log.actionType || '',
        entityName: log.entityName || '',
        referenceId: log.referenceId,
        actionDate: log.actionDate?.toISOString() || new Date().toISOString(),
        oldValue: log.oldValue,
        newValue: log.newValue,
        stockKeeperName: log.employees?.UserName,
        stockKeeperEmail: log.employees?.Email
      }))

    } catch (error) {
      console.error(`Error fetching transaction logs for entity ${entityName}, ID ${referenceId}:`, error)
      throw new Error('Failed to fetch transaction logs by entity')
    }
  }

  /**
   * Validate create transaction log request
   */
  private static validateCreateTransactionLogRequest(
    data: CreateTransactionLogRequest
  ): TransactionLogValidationResult {
    const errors: TransactionLogValidationError[] = []

    if (!data.stockKeeperId || data.stockKeeperId <= 0) {
      errors.push({ field: 'stockKeeperId', message: 'Valid stock keeper ID is required' })
    }

    if (!data.actionType) {
      errors.push({ field: 'actionType', message: 'Action type is required' })
    }

    if (!data.entityName) {
      errors.push({ field: 'entityName', message: 'Entity name is required' })
    }

    const validActionTypes = ['CREATE', 'UPDATE', 'DELETE', 'STOCK_IN', 'STOCK_OUT']
    if (data.actionType && !validActionTypes.includes(data.actionType)) {
      errors.push({ 
        field: 'actionType', 
        message: `Action type must be one of: ${validActionTypes.join(', ')}` 
      })
    }

    const validEntityNames = ['GRN', 'GIN', 'PRODUCT', 'STOCK', 'BINCARD', 'SUPPLIER', 'EMPLOYEE']
    if (data.entityName && !validEntityNames.includes(data.entityName)) {
      errors.push({ 
        field: 'entityName', 
        message: `Entity name must be one of: ${validEntityNames.join(', ')}` 
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}



export async function exportTransactionLogsToCSV(
  logs: TransactionLogWithDetails[], 
  filename?: string
): Promise<void> {
  try {
    console.log(' Exporting transaction logs to CSV:', logs.length, 'records');

    // Define CSV headers based on your table columns
    const headers = [
      'Log ID',
      'Date & Time',
      'Stock Keeper Name',
      'Stock Keeper ID',
      'Action Type',
      'Entity Name',
      'Reference ID',
      'Old Value',
      'New Value'
    ];

    // Convert transaction log data to CSV rows
    const csvRows = logs.map(log => {
      // Format date for CSV
      const actionDate = log.actionDate 
        ? new Date(log.actionDate).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : '';

      // Format action type (replace underscores with spaces)
      const formattedActionType = log.actionType
        ? log.actionType.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase())
        : '';

      // Parse oldValue and newValue if they're JSON strings
      let oldValueDisplay = log.oldValue || '';
      let newValueDisplay = log.newValue || '';

      try {
        if (log.oldValue) {
          const parsed = JSON.parse(log.oldValue);
          oldValueDisplay = parsed.previousQuantity ?? parsed.quantity ?? log.oldValue;
        }
      } catch {
        // Keep original value if not JSON
      }

      try {
        if (log.newValue) {
          const parsed = JSON.parse(log.newValue);
          newValueDisplay = parsed.newQuantity ?? parsed.quantity ?? log.newValue;
        }
      } catch {
        // Keep original value if not JSON
      }

      return [
        log.logId?.toString() || '',
        actionDate,
        log.stockKeeperName || 'Unknown',
        log.stockKeeperId?.toString() || '',
        formattedActionType,
        log.entityName?.toUpperCase() || '',
        log.referenceId?.toString() || 'N/A',
        String(oldValueDisplay),
        String(newValueDisplay)
      ].map(field => {
        // Escape fields that contain commas, quotes, or newlines
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const finalFilename = filename || `transaction_logs_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);

    // Track export in database (optional but recommended)
    try {
      await fetch('/api/transactionlog/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fileName: finalFilename,
          recordCount: logs.length,
          remarks: `Transaction logs export - ${logs.length} records`
        })
      });
      console.log(' Export tracked in database');
    } catch (trackingError) {
      console.error(' Failed to track export (non-critical):', trackingError);
      // Don't throw - export was successful, tracking is just for audit
    }

    console.log(' Transaction logs exported successfully');
  } catch (error) {
    console.error(' Error exporting transaction logs:', error);
    throw new Error('Failed to export transaction logs to CSV');
  }
}