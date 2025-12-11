// productSupplier.ts

export interface ProductSupplier {
  productSupplierId: number;
  productId: number;
  supplierId: number;
  startDate: string | null;
  endDate: string | null;
  isPrimarySupplier: boolean | null;
  status: string | null;
  createdBy: number | null;
  createdAt: string | null;
  updatedBy: number | null;
  updatedAt: string | null;
  deletedBy: number | null;
  deletedAt: string | null;
}

// For creating a new productSupplier
export interface CreateProductSupplierRequest {
  productId: number;
  supplierId: number;
  startDate?: string;
  endDate?: string;
  isPrimarySupplier?: boolean;
  status?: string;
  createdBy?: number;
}

// For updating an existing productSupplier
export interface UpdateProductSupplierRequest {
  productId?: number;
  supplierId?: number;
  startDate?: string;
  endDate?: string;
  isPrimarySupplier?: boolean;
  status?: string;
  updatedBy?: number;
  deletedBy?: number;
  deletedAt?: string;
}
