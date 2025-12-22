export interface Stock {
  stockId: number
  productId: number
  variationId: number | null
  quantityAvailable: number | null
  reorderLevel: number | null
  lastUpdatedDate: Date | null
  location: string | null

  // Optional display fields from joins
  productName?: string
  productSku?: string
  brandName?: string
  categoryName?: string
  variationName?: string
  variationColor?: string
  variationSize?: string
  variationCapacity?: string
}

export interface CreateStockRequest {
  productId: number
  variationId?: number
  quantityAvailable: number
  reorderLevel?: number
  location?: string
}

export interface UpdateStockRequest {
  productId?: number
  variationId?: number
  quantityAvailable?: number
  reorderLevel?: number
  location?: string
}

export interface StockInRequest {
  supplierId: number
  stockKeeperId: number
  receivedDate: string
  remarks?: string
  items: {
    productId: number
    variationId?: number
    quantityReceived: number
    unitCost: number
    location?: string
  }[]
}

// Stock-In item interface
export interface StockInItem {
  productId: number
  variationId?: number | null
  quantityReceived: number
  unitCost: number
  location?: string
}

export interface StockOutRequest {
  stockKeeperId: number
  issuedTo: string
  issueReason: string
  issueDate: string
  remarks?: string
  items: {
    productId: number
    variationId?: number
    quantityIssued: number
    unitCost: number
    location?: string
  }[]
}

// Stock-Out item interface
export interface StockOutItem {
  productId: number
  variationId?: number | null
  quantityIssued: number
  unitCost: number
  location?: string
}

export interface StockFilter {
  productId?: number
  variationId?: number
  locationId?: number
  lowStock?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

// Response interfaces
export interface StockInResponse {
  grnId: number
  grnNumber: string
  totalAmount: number
  createdAt: string
  details: {
    grnDetailId: number
    productId: number
    quantityReceived: number
    unitCost: number
    subTotal: number
  }[]
  stockUpdates: {
    productId: number
    variationId: number
    quantityBefore: number
    quantityAfter: number
  }[]
}

export interface StockOutResponse {
  ginId: number
  ginNumber: string
  createdAt: string
  details: {
    ginDetailId: number
    productId: number
    quantityIssued: number
    unitCost: number
    subTotal: number
  }[]
  stockUpdates: {
    productId: number
    variationId: number
    quantityBefore: number
    quantityAfter: number
  }[]
}

