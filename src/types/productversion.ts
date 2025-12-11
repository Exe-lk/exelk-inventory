// productVersion.ts

export interface ProductVersion {
  versionId: number
  productId: number
  versionNumber: string
  releaseDate: string
  isActive: boolean
  createdAt: string
  createdBy: number
  updatedAt: string
  updatedBy: number
  deletedAt: string | null
  deletedBy: number | null
}

// For creating a new product version
export interface CreateProductVersionRequest {
  productId: number
  versionNumber: string
  releaseDate: string
  isActive?: boolean
}

// For updating an existing product version
export interface UpdateProductVersionRequest {
  productId?: number
  versionNumber?: string
  releaseDate?: string
  isActive?: boolean
}
