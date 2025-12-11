export interface ProductVariation {
  variationId: number;
  versionId: number;
  variationName: string;
  color: string;
  size: string;
  capacity: string;
  barcode: string;
  price: number;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  updatedAt: string;
  deletedBy: number | null;
  deletedAt: string | null;
}

// For creating a new product variation
export interface CreateProductVariationRequest {
  versionId: number;
  variationName: string;
  color?: string;
  size?: string;
  capacity?: string;
  barcode?: string;
  price?: number;
  quantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  isActive?: boolean;
  createdBy: number;
}

// For updating an existing product variation
export interface UpdateProductVariationRequest {
  versionId?: number;
  variationName?: string;
  color?: string;
  size?: string;
  capacity?: string;
  barcode?: string;
  price?: number;
  quantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  isActive?: boolean;
  updatedBy?: number;
  updatedAt?: string;
  deletedBy?: number | null;
  deletedAt?: string | null;
}
