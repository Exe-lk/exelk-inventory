// Base bincard interface
export interface BinCard {
  binCardId: number
  variationId: number
  transactionDate: string // YYYY-MM-DD format
  transactionType: 'GRN' | 'GIN'
  referenceId: number | null
  quantityIn: number
  quantityOut: number
  balance: number
  stockKeeperId: number
  remarks: string | null
}

// Extended bincard with related data for list view
export interface BinCardWithDetails extends BinCard {
  variationName?: string | null
  variationColor?: string | null
  variationSize?: string | null
  variationCapacity?: string | null
  productName?: string | null
  productSku?: string | null
  brandName?: string | null
  stockKeeperName?: string | null
  stockKeeperEmail?: string | null
}

// Complete bincard with all nested relations for single view
export interface BinCardComplete extends BinCard {
  stockKeeper: {
    id: number
    name: string
    email: string
    phone: string | null
  }
  variation: {
    id: number
    name: string | null
    color: string | null
    size: string | null
    capacity: string | null
    barcode: string | null
    price: number | null
    quantity: number | null
    minStockLevel: number | null
    maxStockLevel: number | null
  }
  version: {
    id: number
    number: string | null
    releaseDate: string | null
  }
  product: {
    id: number
    name: string | null
    sku: string | null
    description: string | null
    brand: {
      id: number
      name: string | null
      country: string | null
    }
    category: {
      id: number
      name: string | null
      mainCategory: string | null
    }
    model: {
      id: number
      name: string | null
      description: string | null
    }
    supplier: {
      id: number
      name: string | null
      contactPerson: string | null
      email: string | null
      phone: string | null
    }
  }
}

// Request interfaces
export interface CreateBinCardRequest {
  variationId: number
  transactionDate: string // YYYY-MM-DD
  transactionType: 'GRN' | 'GIN'
  referenceId?: number
  quantityIn?: number
  quantityOut?: number
  balance: number
  stockKeeperId: number
  remarks?: string
}

// Query interfaces
export interface BinCardQueryParams {
  page?: number
  limit?: number
  sortBy?: 'bincardId' | 'variationId' | 'transactionDate' | 'transactionType' | 'referenceId' | 'quantityIn' | 'quantityOut' | 'balance' | 'employeeId'
  sortOrder?: 'asc' | 'desc'
  search?: string
  variationId?: number
  transactionType?: 'GRN' | 'GIN'
  stockKeeperId?: number
}

export interface BinCardFilters {
  variationId: number | null
  transactionType: string | null
  stockKeeperId: number | null
}

export interface BinCardSorting {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface BinCardPagination {
  totalItems: number
  page: number
  limit: number
  totalPages: number
}

// Response interfaces
export interface BinCardListResponse {
  status: 'success' | 'error'
  code: number
  message: string
  timestamp: string
  data: {
    items: BinCardWithDetails[]
    pagination: BinCardPagination
    sorting: BinCardSorting
    search: string | null
    filters: BinCardFilters
  }
}

export interface BinCardSingleResponse {
  status: 'success' | 'error'
  code: number
  message: string
  timestamp: string
  data: BinCardComplete
}

export interface BinCardCreateResponse {
  status: 'success' | 'error'
  code: number
  message: string
  timestamp: string
  data: BinCard
}

// Error response
export interface BinCardErrorResponse {
  status: 'error'
  code: number
  message: string
  timestamp: string
  details?: string
}

// Database model interfaces (for internal use)
export interface BinCardDB {
  bincardId: number
  variationId: number
  transactionDate: Date | null
  transactionType: string | null
  referenceId: number | null
  quantityIn: number | null
  quantityOut: number | null
  balance: number | null
  employeeId: number
  remarks: string | null
}

export interface BinCardDBWithRelations extends BinCardDB {
  productvariation?: {
    variationId: number
    variationName: string | null
    color: string | null
    size: string | null
    capacity: string | null
    barcode: string | null
    price: any | null
    quantity: number | null
    minStockLevel: number | null
    maxStockLevel: number | null
    version?: {
      versionId: number
      versionNumber: string | null
      releaseDate: Date | null
      product?: {
        productId: number
        productName: string | null
        sku: string | null
        description: string | null
        brand?: {
          brandId: number
          brandName: string | null
          country: string | null
        }
        category?: {
          categoryId: number
          categoryName: string | null
          mainCategory: string | null
        }
        model?: {
          modelId: number
          modelName: string | null
          description: string | null
        }
        supplier?: {
          supplierId: number
          supplierName: string | null
          contactPerson: string | null
          email: string | null
          phone: string | null
        }
      }
    }
  }
  employees?: {
    EmployeeID: number
    UserName: string
    Email: string
    Phone: string | null
  }
}

// Validation interfaces
export interface BinCardValidationError {
  field: string
  message: string
}

export interface BinCardValidationResult {
  isValid: boolean
  errors: BinCardValidationError[]
}