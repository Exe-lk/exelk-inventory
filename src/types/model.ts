export interface Model {
   ModelID: number
  ModelName: string
  Description: string
  BrandID: number
  IsActive: boolean
  CreatedAt: string
  CreatedBy: number
  UpdatedAt: string
  UpdatedBy: number
  DeletedAt: string | null
  DeletedBy: number | null
}

// For creating a new model
export interface CreateModelRequest {
  ModelName: string
  Description: string
  BrandID: number
  IsActive?: boolean
}

// For updating an existing model
export interface UpdateModelRequest {
  ModelName?: string
  Description?: string
  BrandID?: number
  IsActive?: boolean
}