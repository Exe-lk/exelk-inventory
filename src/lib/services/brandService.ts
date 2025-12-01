import { Brand, CreateBrandRequest, UpdateBrandRequest } from '@/types/brand';

// Base URL for brand API
const BASE_URL = '/api/brand';

// Fetch all brands
export async function fetchBrands(): Promise<Brand[]> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch brands');
    }
    
    const result = await response.json();
    console.log('API Response:', result); // Debug log
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data && result.data.items) {
      // Transform API response to match Brand type (PascalCase)
      return result.data.items.map((item: any) => ({
        BrandID: item.brandID,
        BrandName: item.brandName,
        Description: item.description || '',
        Country: item.country || '',
        IsActive: item.isActive,
        CreatedAt: item.createdAt,
        CreatedBy: item.createdBy || 1,
        UpdatedAt: item.updatedAt || item.createdAt,
        UpdatedBy: item.updatedBy || 1,
        DeletedAt: item.deletedAt || null,
        DeletedBy: item.deletedBy || null
      }));
    } else {
      console.error('Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
}

// Create brand
export async function createBrand(data: CreateBrandRequest): Promise<Brand> {
  try {
    console.log('Creating brand with data:', data); // Debug log
    
    // Transform PascalCase to camelCase for API
    const apiData = {
      brandName: data.BrandName,
      description: data.Description || '',
      country: data.Country || '',
      isActive: data.IsActive !== undefined ? data.IsActive : true
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create brand');
    }
    
    const result = await response.json();
    console.log('Create response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform camelCase response back to PascalCase Brand type
      return {
        BrandID: result.data.brandID,
        BrandName: result.data.brandName,
        Description: result.data.description || '',
        Country: result.data.country || '',
        IsActive: result.data.isActive,
        CreatedAt: result.data.createdAt,
        CreatedBy: result.data.createdBy || 1,
        UpdatedAt: result.data.updatedAt || result.data.createdAt,
        UpdatedBy: result.data.updatedBy || 1,
        DeletedAt: result.data.deletedAt || null,
        DeletedBy: result.data.deletedBy || null
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error creating brand:', error);
    throw error;
  }
}

// Update brand
export async function updateBrand(id: number, data: UpdateBrandRequest): Promise<Brand> {
  try {
    console.log('Updating brand:', id, data); // Debug log
    
    // Transform PascalCase to camelCase for API
    const apiData = {
      brandId: id, // Use the correct field name
      ...(data.BrandName !== undefined && { brandName: data.BrandName }),
      ...(data.Description !== undefined && { description: data.Description }),
      ...(data.Country !== undefined && { country: data.Country }),
      ...(data.IsActive !== undefined && { isActive: data.IsActive })
    };

    console.log('Sending update data:', apiData); // Debug log

    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Update error response:', errorData); // Debug log
      throw new Error(errorData.message || 'Failed to update brand');
    }
    
    const result = await response.json();
    console.log('Update response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform camelCase response back to PascalCase Brand type
      return {
        BrandID: result.data.brandID,
        BrandName: result.data.brandName,
        Description: result.data.description || '',
        Country: result.data.country || '',
        IsActive: result.data.isActive,
        CreatedAt: result.data.createdAt,
        CreatedBy: result.data.createdBy || 1,
        UpdatedAt: result.data.updatedAt,
        UpdatedBy: result.data.updatedBy || 1,
        DeletedAt: result.data.deletedAt || null,
        DeletedBy: result.data.deletedBy || null
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error updating brand:', error);
    throw error;
  }
}

// Delete brand
export async function deleteBrand(id: number): Promise<void> {
  try {
    console.log('Deleting brand:', id); // Debug log
    
    // Use brandId parameter name to match the API route
    const response = await fetch(`${BASE_URL}?brandId=${id}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Delete error response:', errorData); // Debug log
      throw new Error(errorData.message || 'Failed to delete brand');
    }
    
    const result = await response.json();
    console.log('Delete response:', result); // Debug log
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete brand');
    }
  } catch (error) {
    console.error('Error deleting brand:', error);
    throw error;
  }
}