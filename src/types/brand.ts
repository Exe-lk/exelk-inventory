export interface Brand {
  BrandID: number
  BrandName: string
  Description: string
  Country: string
  IsActive: boolean
  CreatedAt: string
  CreatedBy: number
  UpdatedAt: string
  UpdatedBy: number
  DeletedAt: string | null
  DeletedBy: number | null
}

// For creating a new brand
export interface CreateBrandRequest {
  BrandName: string
  Description: string
  Country: string
  IsActive?: boolean
}

// For updating an existing brand
export interface UpdateBrandRequest {
  BrandName?: string
  Description?: string
  Country?: string
  IsActive?: boolean
}