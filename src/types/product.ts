// product.ts

export interface Product {
  productId: number;
  sku: string;
  productName: string;
  description: string;
  categoryId: number;
  brandId: number;
  modelId: number;
  supplierId: number;
  isActive: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
  deletedAt: string | null;
  deletedBy: number | null;
}

// For creating a new product
export interface CreateProductRequest {
  sku: string;
  productName: string;
  description: string;
  categoryId: number;
  brandId: number;
  modelId: number;
  supplierId: number;
  isActive?: boolean; // optional, defaults to true
}

// For updating an existing product
export interface UpdateProductRequest {
  sku?: string;
  productName?: string;
  description?: string;
  categoryId?: number;
  brandId?: number;
  modelId?: number;
  supplierId?: number;
  isActive?: boolean;
}
