export interface GRNDetail {
  grnDetailId: number
  grnId: number
  productId: number
  quantityReceived: number
  unitCost: number
  subTotal: number
  location: string | null
}

export interface CreateGRNDetailRequest {
  grnId: number
  productId: number
  quantityReceived: number
  unitCost: number
  location?: string
}

export interface UpdateGRNDetailRequest {
  productId?: number
  quantityReceived?: number
  unitCost?: number
  location?: string
}