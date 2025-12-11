export interface SpecDetail {
  specDetailId: number
  variationId: number
  specId: number
  specValue: string
 
  createdAt: string
  createdBy: number
  updatedAt: string
  updatedBy: number
  deletedAt: string | null
  deletedBy: number | null
}

// For creating a new spec detail
export interface CreateSpecDetailRequest {
  variationId: number
  specId: number
  specValue: string
  
}

// For updating an existing spec detail
export interface UpdateSpecDetailRequest {
  variationId?: number
  specId?: number
  specValue?: string
  
}
