import { ProductVersion, CreateProductVersionRequest, UpdateProductVersionRequest } from '@/types/productversion';

// Base URL for product version API
const BASE_URL = '/api/productversion';

// Fetch all product versions
export async function fetchProductVersions(): Promise<ProductVersion[]> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch product versions');
    }
    
    const result = await response.json();
    console.log('API Response:', result); // Debug log
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data && result.data.items) {
      // Transform API response to match ProductVersion type
      return result.data.items.map((item: any) => ({
        versionId: item.versionId,
        productId: item.productId,
        versionNumber: item.versionNumber,
        releaseDate: item.releaseDate,
        isActive: item.isActive,
        createdAt: item.createdAt,
        createdBy: item.createdBy || 1,
        updatedAt: item.updatedAt || item.createdAt,
        updatedBy: item.updatedBy || 1,
        deletedAt: item.deletedAt || null,
        deletedBy: item.deletedBy || null
      }));
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching product versions:', error);
    throw error;
  }
}

// Create product version
export async function createProductVersion(data: CreateProductVersionRequest): Promise<ProductVersion> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create product version');
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      return {
        versionId: result.data.versionId,
        productId: result.data.productId,
        versionNumber: result.data.versionNumber,
        releaseDate: result.data.releaseDate,
        isActive: result.data.isActive,
        createdAt: result.data.createdAt,
        createdBy: result.data.createdBy,
        updatedAt: result.data.updatedAt,
        updatedBy: result.data.updatedBy,
        deletedAt: result.data.deletedAt,
        deletedBy: result.data.deletedBy
      };
    } else {
      throw new Error(result.message || 'Failed to create product version');
    }
  } catch (error) {
    console.error('Error creating product version:', error);
    throw error;
  }
}

// Update product version
export async function updateProductVersion(id: number, data: UpdateProductVersionRequest): Promise<ProductVersion> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ versionId: id, ...data }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update product version');
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      return {
        versionId: result.data.versionId,
        productId: result.data.productId,
        versionNumber: result.data.versionNumber,
        releaseDate: result.data.releaseDate,
        isActive: result.data.isActive,
        createdAt: result.data.createdAt,
        createdBy: result.data.createdBy,
        updatedAt: result.data.updatedAt,
        updatedBy: result.data.updatedBy,
        deletedAt: result.data.deletedAt,
        deletedBy: result.data.deletedBy
      };
    } else {
      throw new Error(result.message || 'Failed to update product version');
    }
  } catch (error) {
    console.error('Error updating product version:', error);
    throw error;
  }
}

// Delete product version
export async function deleteProductVersion(id: number): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}?versionId=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete product version');
    }
    
    const result = await response.json();
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete product version');
    }
  } catch (error) {
    console.error('Error deleting product version:', error);
    throw error;
  }
}