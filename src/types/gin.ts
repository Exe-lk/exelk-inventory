// // Base GIN interface matching the schema and service
export interface GIN {
  ginId: number
  ginNumber: string | null
  employeeId?: number  // From schema
  stockKeeperId?: number  // From service (alias for employeeId)
  issuedTo: string | null
  issueReason: string | null
  issueDate: string | null  // Changed to string to match service
  remarks: string | null
  createdDate?: string | null  // From service (createdAt)
  updatedDate?: string | null  // From service (updatedAt)
  stockId: number | null
}

// Extended GIN interface with relations
export interface GINWithDetails extends GIN {
  employee?: {
    EmployeeID: number
    UserName: string
    Email: string
  }
  stock?: {
    stockId: number
    productId: number
    quantityAvailable: number | null
    variationId: number | null
    location: string | null
    product: {
      productId: number
      productName: string | null
      sku: string | null
    }
    productvariation?: {
      variationId: number
      variationName: string | null
      color: string | null
      size: string | null
      capacity: string | null
    }
  }
  gindetails?: GINDetailWithProduct[]
}

// GIN Detail interface for related products
export interface GINDetailWithProduct {
  ginDetailId: number
  ginId: number
  productId: number
  quantityIssued: number | null
  unitCost: number | null
  subTotal: number | null
  location: string | null
  product?: {
    productId: number
    productName: string | null
    sku: string | null
    description: string | null
    brand?: {
      brandName: string | null
    }
    category?: {
      categoryName: string | null
    }
  }
}

// Request interfaces for creating GIN - matching ginService
export interface CreateGINRequest {
  ginNumber?: string
  issuedTo: string
  issueReason?: string
  issueDate: string
  remarks?: string
  stockId?: number
}

// Complete GIN creation request - matching ginService
export interface CreateCompleteGINRequest {
  ginNumber: string
  issuedTo: string
  issueReason?: string
  issueDate: string
  remarks?: string
  stockId?: number
  ginDetails: {
    productId: number
    quantityIssued: number
    unitCost: number
    location?: string
  }[]
}

// Request interfaces for updating GIN - matching ginService
export interface UpdateGINRequest {
  ginNumber?: string
  issuedTo?: string
  issueReason?: string
  issueDate?: string
  remarks?: string
  stockId?: number
}

// Response interfaces - matching ginService structure
export interface GINResponse extends GIN {
  totalQuantityIssued?: number
  totalValue?: number
  ginDetails?: GINDetailWithProduct[]
}

// Create response for simple GIN
export interface GINCreateResponse {
  status: string
  message: string
  data: GIN
}

// Create response for complete GIN - matching ginService
export interface GINCompleteCreateResponse {
  status: string
  message: string
  data: {
    gin: GIN
    ginDetails: GINDetailWithProduct[]
    totalDetailsCreated: number
  }
}

// Update response
export interface GINUpdateResponse {
  status: string
  message: string
  data: GIN
}

// List response interface - matching ginService fetchGinsWithParams
export interface GINListResponse {
  items: GIN[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  sorting: {
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  search: string | null
  filters: {
    issuedTo?: string
    stockKeeperId?: number
    issueReason?: string
  }
}

// Query parameters interface - matching ginService
export interface GetGINQueryParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  issuedTo?: string
  stockKeeperId?: number
  issueReason?: string
  id?: number  // For single GIN fetch
}

// Filter interface for GIN searches - matching ginService
export interface GINFilter {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  issuedTo?: string
  stockKeeperId?: number
  issueReason?: string
  dateFrom?: string
  dateTo?: string
  stockId?: number
  productId?: number
}

// Search parameters - matching ginService searchGins
export interface GINSearchParams {
  search: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  issuedTo?: string
  stockKeeperId?: number
  issueReason?: string
}

// Statistics interface - matching ginService getGinStatistics
export interface GINStatistics {
  totalGins: number
  recentGins: GIN[]
}

// Service response interface
export interface ServiceResponse<T> {
  status: 'success' | 'error'
  message: string
  data?: T
  error?: string
}

// GIN Status and Reason enums
export enum IssueReason {
  SALES = 'SALES',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  TRANSFER = 'TRANSFER',
  SAMPLE = 'SAMPLE',
  PROMOTIONAL = 'PROMOTIONAL',
  RETURN_TO_SUPPLIER = 'RETURN_TO_SUPPLIER',
  DISPOSAL = 'DISPOSAL',
  OTHER = 'OTHER'
}

// Error types
export interface GINError {
  code: string
  message: string
  details?: any
}

export class GINNotFoundError extends Error {
  constructor(ginId: number) {
    super(`GIN with ID ${ginId} not found`)
    this.name = 'GINNotFoundError'
  }
}

export class GINValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GINValidationError'
  }
}

export class InsufficientStockError extends Error {
  constructor(productId: number, requestedQuantity: number, availableQuantity: number) {
    super(`Insufficient stock for product ${productId}. Requested: ${requestedQuantity}, Available: ${availableQuantity}`)
    this.name = 'InsufficientStockError'
  }
}

// Database types (matching Prisma schema exactly)
export interface GINTableData {
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

// Utility types
export type CreateGINData = Omit<GINTableData, 'ginId' | 'createdDate' | 'updatedDate'>
export type UpdateGINData = Partial<Omit<GINTableData, 'ginId' | 'createdDate'>>

// API mapping helper types
export interface GINAPIResponse {
  ginId: number
  ginNumber: string | null
  stockKeeperId: number
  issuedTo: string | null
  issueReason: string | null
  issueDate: string | null
  remarks: string | null
  stockId: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

// Bulk operations interfaces
export interface BulkCreateGINRequest {
  gins: CreateGINRequest[]
}

export interface BulkGINResponse {
  status: string
  message: string
  data: {
    successful: GIN[]
    failed: {
      index: number
      error: string
      gin: any
    }[]
    summary: {
      totalProcessed: number
      successful: number
      failed: number
    }
  }
}

// Filter and search types
export interface GINFilters {
  employeeId?: number
  issuedTo?: string
  issueReason?: string
  dateRange?: {
    from: string
    to: string
  }
  stockId?: number
  hasDetails?: boolean
}

export interface GINSearchCriteria {
  query: string
  fields: ('ginNumber' | 'issuedTo' | 'issueReason' | 'remarks')[]
}

// Summary and analytics interfaces
export interface GINSummary {
  totalGINs: number
  totalQuantityIssued: number
  totalValue: number
  byReason: Record<string, number>
  byEmployee: Record<string, number>
  byMonth: Record<string, number>
}

// Stock impact interface for GIN transactions
export interface GINStockImpact {
  productId: number
  variationId?: number
  quantityIssued: number
  stockBefore: number
  stockAfter: number
  stockLocation?: string
}

// Delete response interface
export interface GINDeleteResponse {
  status: string
  message: string
}

// Validation interfaces
export interface GINValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Form data interface for UI components
export interface GINFormData {
  ginNumber: string
  issuedTo: string
  issueReason: string
  issueDate: string
  remarks: string
  stockId?: number
}