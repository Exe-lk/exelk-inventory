import { Model, CreateModelRequest, UpdateModelRequest } from '@/types/model';
import { Brand } from '@/types/brand';

// Base URL for model API
const BASE_URL = '/api/model';

// Fetch all models
export async function fetchModels(): Promise<Model[]> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch models');
    }
    
    const result = await response.json();
    console.log('API Response:', result); // Debug log
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data && result.data.items) {
      // Transform camelCase to PascalCase to match your types
      return result.data.items.map((item: any) => ({
        ModelID: item.modelID,
        ModelName: item.modelName,
        Description: item.description || '',
        BrandID: item.brandID,
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
    console.error('Error fetching models:', error);
    throw error;
  }
}

// Create model
export async function createModel(data: CreateModelRequest): Promise<Model> {
  try {
    console.log('Creating model with data:', data); // Debug log
    
    // Transform PascalCase to camelCase for API
    const apiData = {
      modelName: data.ModelName,
      description: data.Description || '',
      brandID: data.BrandID,
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
      throw new Error(errorData.message || 'Failed to create model');
    }
    
    const result = await response.json();
    console.log('Create response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform camelCase response back to PascalCase Model type
      return {
        ModelID: result.data.modelID,
        ModelName: result.data.modelName,
        Description: result.data.description || '',
        BrandID: result.data.brandID,
        IsActive: result.data.isActive,
        CreatedAt: result.data.createdAt,
        CreatedBy: 1,
        UpdatedAt: result.data.updatedAt || result.data.createdAt,
        UpdatedBy: 1,
        DeletedAt: null,
        DeletedBy: null
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error creating model:', error);
    throw error;
  }
}

// Update model
export async function updateModel(id: number, data: UpdateModelRequest): Promise<Model> {
  try {
    console.log('Updating model:', id, data); // Debug log
    
    // Transform PascalCase to camelCase for API
    const apiData = {
      modelID: id,
      ...(data.ModelName !== undefined && { modelName: data.ModelName }),
      ...(data.Description !== undefined && { description: data.Description }),
      ...(data.BrandID !== undefined && { brandID: data.BrandID }),
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
      throw new Error(errorData.message || 'Failed to update model');
    }
    
    const result = await response.json();
    console.log('Update response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform camelCase response back to PascalCase Model type
      return {
        ModelID: result.data.modelID,
        ModelName: result.data.modelName,
        Description: result.data.description || '',
        BrandID: result.data.brandID,
        IsActive: result.data.isActive,
        CreatedAt: result.data.createdAt,
        CreatedBy: 1,
        UpdatedAt: result.data.updatedAt,
        UpdatedBy: 1,
        DeletedAt: null,
        DeletedBy: null
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error updating model:', error);
    throw error;
  }
}

// Delete model
export async function deleteModel(id: number): Promise<void> {
  try {
    console.log('Deleting model:', id); // Debug log
    
    // Use modelID parameter name to match the API route
    const response = await fetch(`${BASE_URL}?modelID=${id}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Delete error response:', errorData); // Debug log
      throw new Error(errorData.message || 'Failed to delete model');
    }
    
    const result = await response.json();
    console.log('Delete response:', result); // Debug log
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete model');
    }
  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
}

// Fetch all brands for dropdown
export async function fetchBrands(): Promise<Brand[]> {
  try {
    const response = await fetch('/api/brand', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch brands');
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data && result.data.items) {
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
      throw new Error('Invalid brands response format');
    }
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
}