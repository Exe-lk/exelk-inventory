// Base Return Types
export interface Return {
  returnId: number
  returnNumber: string
  supplierId: number
  employeeId: number
  returnType: string | null
  returnDate: Date | null
  reason: string | null
  remarks: string | null
  approved: boolean | null
  returnStatus: string | null
}

export interface ReturnProduct {
  returnProductId: number
  returnId: number
  variationId: number
  quantity: number | null
  remarks: string | null
}

// Extended Return Types with Relations
export interface ReturnWithDetails extends Return {
  supplier: {
    supplierId: number
    supplierName: string | null
    contactPerson?: string | null
    email?: string | null
    phone?: string | null
  }
  employee: {
    employeeId: number
    userName: string
    email?: string
  }
  details: ReturnProductDetail[]
}

interface ReturnProductDetail {
  returnProductId: number;
  productId: number;
  productName: string;
  productSku?: string;
  brandName?: string;
  categoryName?: string;
  variationId: number;
  variationName: string;
  quantityReturned: number;
  remarks?: string;
}


// export interface ReturnProductDetail {
//   returnProductId: number
//   productId: number
//   productName: string | null
//   productSku: string | null
//   productDescription?: string | null
//   brandName?: string | null
//   categoryName?: string | null
//   variationId: number
//   variationName: string | null
//   variationColor?: string | null
//   variationSize?: string | null
//   variationCapacity?: string | null
//   quantityReturned: number | null
//   remarks: string | null
// }

// Request/Response Types
export interface CreateReturnRequest {
  supplierId: number
  returnType?: string
  returnDate: string
  reason: string
  remarks?: string
  returnStatus?: string
  approved?: boolean
  details: CreateReturnProductRequest[]
}

export interface CreateReturnProductRequest {
  variationId: number
  quantity: number
  remarks?: string
}

export interface UpdateReturnRequest {
  supplierId?: number
  returnType?: string
  returnDate?: string
  reason?: string
  remarks?: string
  returnStatus?: string
  approved?: boolean
  details?: UpdateReturnProductRequest[]
}

export interface UpdateReturnProductRequest {
  returnProductId?: number
  variationId: number
  quantity: number
  remarks?: string
}

// API Response Types
export interface ReturnResponse {
  returnId: number
  returnNumber: string
  returnedBy: number
  returnDate: string | null
  reason: string | null
  status: string | null
  remarks: string | null
  returnType: string | null
  approved: boolean | null
  supplier: {
    supplierId: number
    supplierName: string | null
  }
  employee?: {
    employeeId: number
    userName: string
  }
  details: ReturnProductResponse[]
}

export interface ReturnProductResponse {
  returnProductId: number
  productId: number
  productName: string | null
  productSku?: string | null
  productDescription?: string | null
  brandName?: string | null
  categoryName?: string | null
  variationId: number
  variationName?: string | null
  variationColor?: string | null
  variationSize?: string | null
  variationCapacity?: string | null
  quantityReturned: number | null
  remarks: string | null
}

// List Response Types
export interface ReturnsListResponse {
  items: ReturnResponse[]
  pagination: {
    totalItems: number
    page: number
    limit: number
    totalPages: number
  }
  sorting: {
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  search: string | null
  filters: {
    supplierId: number | null
    returnType: string | null
    returnStatus: string | null
  }
}

// Query Parameters
export interface GetReturnsQueryParams {
  page?: number
  limit?: number
  sortBy?: 'returnId' | 'returnDate' | 'returnType' | 'returnStatus' | 'supplierId'
  sortOrder?: 'asc' | 'desc'
  search?: string
  supplierId?: number
  returnType?: string
  returnStatus?: string
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Return Status Enums
export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ReturnType {
  SUPPLIER_RETURN = 'SUPPLIER_RETURN',
  DAMAGED_RETURN = 'DAMAGED_RETURN',
  EXPIRED_RETURN = 'EXPIRED_RETURN',
  DEFECTIVE_RETURN = 'DEFECTIVE_RETURN',
  CUSTOMER_RETURN = 'CUSTOMER_RETURN',
  OTHER = 'OTHER'
}

// Error Types
export interface ReturnError {
  code: string
  message: string
  details?: any
}

export class ReturnNotFoundError extends Error {
  constructor(returnId: number) {
    super(`Return with ID ${returnId} not found`)
    this.name = 'ReturnNotFoundError'
  }
}

export class ReturnValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ReturnValidationError'
  }
}

export class SupplierNotFoundError extends Error {
  constructor(supplierId: number) {
    super(`Supplier with ID ${supplierId} not found`)
    this.name = 'SupplierNotFoundError'
  }
}

export class VariationNotFoundError extends Error {
  constructor(variationId: number) {
    super(`Product variation with ID ${variationId} not found`)
    this.name = 'VariationNotFoundError'
  }
}

// Database Types (matching Prisma schema)
export interface ReturnsTableData {
  returnId: number
  supplierId: number
  employeeId: number
  returnType: string | null
  returnDate: Date | null
  reason: string | null
  remarks: string | null
  approved: boolean | null
  returnStatus: string | null
}

export interface ReturnProductTableData {
  returnProductId: number
  returnId: number
  variationId: number
  quantity: number | null
  remarks: string | null
}

// Utility Types
export type CreateReturnData = Omit<ReturnsTableData, 'returnId'>
export type UpdateReturnData = Partial<Omit<ReturnsTableData, 'returnId'>>
export type CreateReturnProductData = Omit<ReturnProductTableData, 'returnProductId'>
export type UpdateReturnProductData = Partial<Omit<ReturnProductTableData, 'returnProductId' | 'returnId'>>

// Filter and Search Types
export interface ReturnFilters {
  supplierId?: number
  employeeId?: number
  returnType?: string
  returnStatus?: string
  returnDate?: {
    from?: Date
    to?: Date
  }
  approved?: boolean
}

export interface ReturnSearchCriteria {
  query?: string
  filters?: ReturnFilters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}