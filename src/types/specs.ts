// specs.ts

export interface Specs {
  specId: number
  specName: string
 
  createdAt: string
  createdBy: number
  updatedAt: string
  updatedBy: number
  deletedAt: string | null
  deletedBy: number | null
}

// For creating a new spec
export interface CreateSpecRequest {
  specName: string
  
  isActive?: boolean
}

// For updating an existing spec
export interface UpdateSpecRequest {
  specName?: string
 
  isActive?: boolean
}
