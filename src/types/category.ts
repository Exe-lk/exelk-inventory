export interface Category {
  CategoryID: number
  CategoryName: string
  Description: string
  MainCategory: string | null
  IsActive: boolean
  CreatedAt: string
  CreatedBy: number
  UpdatedAt: string
  UpdatedBy: number
  DeletedAt: string | null
  DeletedBy: number | null
}


// For creating a new category (without auto-generated fields)
export interface CreateCategoryRequest {
  CategoryName: string
  Description: string
  MainCategory?: string | null
  IsActive?: boolean
}

// For updating an existing category
export interface UpdateCategoryRequest {
  CategoryName?: string
  Description?: string
  MainCategory?: string | null
  IsActive?: boolean
}