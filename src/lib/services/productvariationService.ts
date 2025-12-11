import { ProductVariation, CreateProductVariationRequest, UpdateProductVariationRequest } from '@/types/productvariation';

const API_BASE_URL = '/api/productvariation';

export interface ProductVariationResponse {
  status: string;
  code: number;
  message: string;
  timestamp: string;
  data?: {
    items: ProductVariation[];
    pagination: {
      totalItems: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface SingleProductVariationResponse {
  status: string;
  code: number;
  message: string;
  timestamp: string;
  data?: ProductVariation;
}

// Fetch all product variations with pagination and filters
export async function fetchProductVariations(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  versionId?: number;
  color?: string;
  size?: string;
  capacity?: string;
  isActive?: boolean;
}): Promise<ProductVariation[]> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.versionId) searchParams.append('versionId', params.versionId.toString());
    if (params?.color) searchParams.append('color', params.color);
    if (params?.size) searchParams.append('size', params.size);
    if (params?.capacity) searchParams.append('capacity', params.capacity);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const url = `${API_BASE_URL}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: ProductVariationResponse = await response.json();
    
    if (data.status === 'success' && data.data) {
      return data.data.items;
    } else {
      throw new Error(data.message || 'Failed to fetch product variations');
    }
  } catch (error) {
    console.error('Error fetching product variations:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching product variations');
  }
}

// Create a new product variation
export async function createProductVariation(variationData: CreateProductVariationRequest): Promise<ProductVariation> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(variationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: SingleProductVariationResponse = await response.json();
    
    if (data.status === 'success' && data.data) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create product variation');
    }
  } catch (error) {
    console.error('Error creating product variation:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while creating the product variation');
  }
}

// Update an existing product variation
export async function updateProductVariation(variationId: number, updateData: UpdateProductVariationRequest): Promise<ProductVariation> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ variationId, ...updateData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: SingleProductVariationResponse = await response.json();
    
    if (data.status === 'success' && data.data) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to update product variation');
    }
  } catch (error) {
    console.error('Error updating product variation:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while updating the product variation');
  }
}

// Delete a product variation
export async function deleteProductVariation(variationId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}?variationId=${variationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to delete product variation');
    }
  } catch (error) {
    console.error('Error deleting product variation:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while deleting the product variation');
  }
}

// Get product variation by ID
export async function getProductVariationById(variationId: number): Promise<ProductVariation | null> {
  try {
    const variations = await fetchProductVariations();
    return variations.find(variation => variation.variationId === variationId) || null;
  } catch (error) {
    console.error('Error getting product variation by ID:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching the product variation');
  }
}