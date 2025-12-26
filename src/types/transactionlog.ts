// Base transaction log interface
export interface TransactionLog {
  logId: number
  stockKeeperId: number
  actionType: string
  entityName: string
  referenceId: number | null
  actionDate: string // ISO string format
  oldValue: string | null
  newValue: string | null
}

// Extended transaction log with related data for list view
export interface TransactionLogWithDetails extends TransactionLog {
  stockKeeperName?: string | null
  stockKeeperEmail?: string | null
}

// Request interfaces
export interface CreateTransactionLogRequest {
  stockKeeperId: number
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STOCK_IN' | 'STOCK_OUT'
  entityName: 'GRN' | 'GIN' | 'PRODUCT' | 'STOCK' | 'BINCARD' | 'SUPPLIER' | 'EMPLOYEE'
  referenceId?: number
  oldValue?: string | object
  newValue?: string | object
}

// Query interfaces
export interface TransactionLogQueryParams {
  page?: number
  limit?: number
  sortBy?: 'logId' | 'employeeId' | 'actionType' | 'entityName' | 'referenceId' | 'actionDate'
  sortOrder?: 'asc' | 'desc'
  search?: string
  stockKeeperId?: number
  actionType?: string
  entityName?: string
  referenceId?: number
  dateFrom?: string
  dateTo?: string
}

export interface TransactionLogFilters {
  stockKeeperId: number | null
  actionType: string | null
  entityName: string | null
  referenceId: number | null
  dateFrom: string | null
  dateTo: string | null
}

export interface TransactionLogSorting {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface TransactionLogPagination {
  totalItems: number
  page: number
  limit: number
  totalPages: number
}

// Response interfaces
export interface TransactionLogListResponse {
  status: 'success' | 'error'
  code: number
  message: string
  timestamp: string
  data: {
    items: TransactionLogWithDetails[]
    pagination: TransactionLogPagination
    sorting: TransactionLogSorting
    search: string | null
    filters: TransactionLogFilters
  }
}

export interface TransactionLogCreateResponse {
  status: 'success' | 'error'
  code: number
  message: string
  timestamp: string
  data: TransactionLog
}

// Error response
export interface TransactionLogErrorResponse {
  status: 'error'
  code: number
  message: string
  timestamp: string
  details?: string
}

// Database model interfaces (for internal use)
export interface TransactionLogDB {
  logId: number
  employeeId: number
  actionType: string | null
  entityName: string | null
  referenceId: number | null
  actionDate: Date | null
  oldValue: string | null
  newValue: string | null
}

export interface TransactionLogDBWithRelations extends TransactionLogDB {
  employees?: {
    EmployeeID: number
    UserName: string
    Email: string
    Phone: string | null
  }
}

// Validation interfaces
export interface TransactionLogValidationError {
  field: string
  message: string
}

export interface TransactionLogValidationResult {
  isValid: boolean
  errors: TransactionLogValidationError[]
}

// Utility types for creating logs
export type StockTransactionData = {
  operation: 'STOCK_IN' | 'STOCK_OUT'
  grnId?: number
  ginId?: number
  items: Array<{
    productId: number
    variationId?: number
    quantity: number
    unitCost: number
  }>
}