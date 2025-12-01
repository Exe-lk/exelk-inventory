export interface Supplier {
  SupplierID: number
  SupplierName: string
  ContactPerson: string
  Email: string
  Phone: string
  Address: string
  City: string
  Country: string
  IsActive: boolean
  CreatedAt: string
  CreatedBy: number
  UpdatedAt: string
  UpdatedBy: number
  DeletedAt: string | null
  DeletedBy: number | null
}

// For creating a new supplier
export interface CreateSupplierRequest {
  SupplierName: string
  ContactPerson: string
  Email: string
  Phone: string
  Address: string
  City: string
  Country: string
  IsActive?: boolean
}

// For updating an existing supplier
export interface UpdateSupplierRequest {
  SupplierName?: string
  ContactPerson?: string
  Email?: string
  Phone?: string
  Address?: string
  City?: string
  Country?: string
  IsActive?: boolean
}