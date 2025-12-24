// Base GIN Detail interface matching the schema and service
export interface GINDetail {
  ginDetailId: number
  ginId: number
  productId: number
  quantityIssued: number
  unitCost: number
  subTotal: number | null
  location: string | null
}

// Extended GIN Detail with product information
export interface GINDetailWithProduct extends GINDetail {
  product?: {
    productId: number
    productName: string | null
    sku: string | null
    description: string | null
    categoryId?: number
    brandId?: number
    modelId?: number
    brand?: {
      brandId: number
      brandName: string | null
    }
    category?: {
      categoryId: number
      categoryName: string | null
    }
    model?: {
      modelId: number
      modelName: string | null
    }
  }
  gin?: {
    ginId: number
    ginNumber: string | null
    employeeId: number
    issuedTo: string | null
    issueReason: string | null
    issueDate: string | null
    employee?: {
      EmployeeID: number
      UserName: string
      Email: string
    }
  }
}

// Request interfaces for creating GIN details - matching gindetailsService
export interface CreateGINDetailRequest {
  ginId: number
  productId: number
  quantityIssued: number
  unitCost: number
  location?: string
}

// Request interfaces for updating GIN details - matching gindetailsService
export interface UpdateGINDetailRequest {
  productId?: number
  quantityIssued?: number
  unitCost?: number
  location?: string
}

// Response interfaces
export interface GINDetailResponse extends GINDetailWithProduct {
  calculatedSubTotal?: number
  stockImpact?: {
    stockBefore: number
    stockAfter: number
    variationId?: number
  }
}

// Single detail response
export interface GINDetailCreateResponse {
  status: string
  message: string
  data: GINDetail
}

export interface GINDetailUpdateResponse {
  status: string
  message: string
  data: GINDetail
}

// Delete response
export interface GINDetailDeleteResponse {
  status: string
  message: string
}

// List response interface - matching service structure
export interface GINDetailListResponse {
  status: string
  data: GINDetail[]
}

// Query parameters for fetching GIN details - matching gindetailsService
export interface GetGINDetailQueryParams {
  ginId?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  productId?: number
  location?: string
  minQuantity?: number
  maxQuantity?: number
  minCost?: number
  maxCost?: number
}

// Filter interface for GIN detail searches
export interface GINDetailFilter {
  ginId?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  productId?: number
  location?: string
  quantityRange?: {
    min: number
    max: number
  }
  costRange?: {
    min: number
    max: number
  }
}

// Validation interfaces - matching gindetailsService
export interface GINDetailValidation {
  ginId: number
  productId: number
  quantityIssued: number
  availableStock?: number
  unitCost?: number
  location?: string
}

export interface GINDetailValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
  stockCheck?: {
    available: number
    requested: number
    sufficient: boolean
  }
}

// Bulk operations interfaces - matching gindetailsService
export interface BulkCreateGINDetailRequest {
  ginId: number
  details: Omit<CreateGINDetailRequest, 'ginId'>[]
}

export interface BulkUpdateGINDetailRequest {
  updates: { detailId: number; data: UpdateGINDetailRequest }[]
}

export interface BulkGINDetailResponse {
  status: string
  message: string
  data: {
    successful: GINDetail[]
    failed: {
      index: number
      error: string
      detail: any
    }[]
    summary: {
      totalProcessed: number
      successful: number
      failed: number
    }
  }
}

// Error types specific to GIN details
export interface GINDetailError {
  code: string
  message: string
  ginDetailId?: number
  productId?: number
  details?: any
}

export class GINDetailNotFoundError extends Error {
  constructor(ginDetailId: number) {
    super(`GIN Detail with ID ${ginDetailId} not found`)
    this.name = 'GINDetailNotFoundError'
  }
}

export class GINDetailValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GINDetailValidationError'
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId: number) {
    super(`Product with ID ${productId} not found`)
    this.name = 'ProductNotFoundError'
  }
}

export class InvalidQuantityError extends Error {
  constructor(quantity: number) {
    super(`Invalid quantity: ${quantity}. Quantity must be greater than 0`)
    this.name = 'InvalidQuantityError'
  }
}

// Database types (matching Prisma schema exactly)
export interface GINDetailTableData {
  ginDetailId: number
  ginId: number
  productId: number
  quantityIssued: number | null
  unitCost: number | null  // Changed from Decimal to number for service compatibility
  subTotal: number | null  // Changed from Decimal to number for service compatibility
  location: string | null
}

// Utility types
export type CreateGINDetailData = Omit<GINDetailTableData, 'ginDetailId'>
export type UpdateGINDetailData = Partial<Omit<GINDetailTableData, 'ginDetailId' | 'ginId'>>

// Calculation utilities
export interface GINDetailCalculation {
  quantity: number
  unitCost: number
  subTotal: number
  totalWithoutTax: number
  taxAmount?: number
  totalWithTax?: number
}

// Summary and analytics interfaces - matching gindetailsService
export interface GINDetailStatistics {
  totalDetails: number
  totalQuantity: number
  totalValue: number
  avgUnitCost: number
}

// Detailed summary interface
export interface GINDetailSummary extends GINDetailStatistics {
  byProduct?: Record<number, {
    productId: number
    productName: string
    totalQuantity: number
    totalValue: number
    timesIssued: number
  }>
  byLocation?: Record<string, {
    location: string
    totalQuantity: number
    totalValue: number
    uniqueProducts: number
  }>
}

// Stock integration interfaces
export interface GINDetailStockUpdate {
  ginDetailId: number
  productId: number
  variationId?: number
  quantityIssued: number
  stockLocation?: string
  updateStock: boolean
  createBinCardEntry: boolean
}

// Service response interface
export interface ServiceResponse<T> {
  status: 'success' | 'error'
  message: string
  data?: T
  error?: string
}

// Form data interface for UI components
export interface GINDetailFormData {
  productId: number
  quantityIssued: number
  unitCost: number
  location: string
}

// Multiple details form interface
export interface MultipleGINDetailsFormData {
  ginId: number
  details: GINDetailFormData[]
}

// API mapping helper for service responses
export interface GINDetailAPIResponse {
  ginDetailId: number
  ginId: number
  productId: number
  quantityIssued: number
  unitCost: number
  subTotal: number | null
  location: string | null
}

// Batch operation tracking
export interface GINDetailBatchOperation {
  operationType: 'create' | 'update' | 'delete'
  ginId: number
  details: GINDetailFormData[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  results?: {
    successful: number
    failed: number
    errors: string[]
  }
}

// Search and filtering
export interface GINDetailSearchParams {
  ginId?: number
  productName?: string
  location?: string
  quantityMin?: number
  quantityMax?: number
  costMin?: number
  costMax?: number
}

// Pagination for detail lists
export interface GINDetailPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Complete detail list response with pagination
export interface GINDetailPaginatedResponse {
  items: GINDetail[]
  pagination: GINDetailPagination
  filters?: GINDetailFilter
  search?: string
}

// Cost calculation helper
export interface GINDetailCostCalculation {
  baseQuantity: number
  baseUnitCost: number
  baseSubTotal: number
  discountPercentage?: number
  discountAmount?: number
  taxPercentage?: number
  taxAmount?: number
  finalTotal: number
}

// Stock validation for detail creation
export interface GINDetailStockValidation {
  productId: number
  requestedQuantity: number
  availableStock: number
  isValid: boolean
  message?: string
}