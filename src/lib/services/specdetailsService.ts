import { SpecDetail, CreateSpecDetailRequest, UpdateSpecDetailRequest } from '@/types/specdetails';

// Base URL for spec details API
const BASE_URL = '/api/specdetails';

// Fetch all spec details
export async function fetchSpecDetails(): Promise<SpecDetail[]> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch spec details');
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data && result.data.items) {
      return result.data.items.map((item: any) => ({
        specDetailId: item.specDetailId,
        variationId: item.variationId,
        specId: item.specId,
        specValue: item.specValue,
        createdAt: item.createdAt,
        createdBy: 1,
        updatedAt: item.updatedAt,
        updatedBy: 1,
        deletedAt: null,
        deletedBy: null
      }));
    } else {
      console.error('Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching spec details:', error);
    throw error;
  }
}

// Create spec detail
export async function createSpecDetail(data: CreateSpecDetailRequest): Promise<SpecDetail> {
  try {
    console.log('Creating spec detail with data:', data);
    
    const apiData = {
      variationId: data.variationId,
      specId: data.specId,
      specValue: data.specValue
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create spec detail');
    }
    
    const result = await response.json();
    console.log('Create response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        specDetailId: result.data.specDetailId,
        variationId: result.data.variationId,
        specId: result.data.specId,
        specValue: result.data.specValue,
        createdAt: result.data.createdAt,
        createdBy: 1,
        updatedAt: result.data.updatedAt,
        updatedBy: 1,
        deletedAt: null,
        deletedBy: null
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error creating spec detail:', error);
    throw error;
  }
}

// Update spec detail
export async function updateSpecDetail(id: number, data: UpdateSpecDetailRequest): Promise<SpecDetail> {
  try {
    console.log('Updating spec detail:', id, data);
    
    const apiData = {
      specDetailId: id,
      ...(data.variationId !== undefined && { variationId: data.variationId }),
      ...(data.specId !== undefined && { specId: data.specId }),
      ...(data.specValue !== undefined && { specValue: data.specValue })
    };

    console.log('Sending update data:', apiData);

    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Update error response:', errorData);
      throw new Error(errorData.message || 'Failed to update spec detail');
    }
    
    const result = await response.json();
    console.log('Update response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        specDetailId: result.data.specDetailId,
        variationId: result.data.variationId,
        specId: result.data.specId,
        specValue: result.data.specValue,
        createdAt: result.data.createdAt,
        createdBy: 1,
        updatedAt: result.data.updatedAt,
        updatedBy: 1,
        deletedAt: null,
        deletedBy: null
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error updating spec detail:', error);
    throw error;
  }
}

// Delete spec detail
export async function deleteSpecDetail(id: number): Promise<void> {
  try {
    console.log('Deleting spec detail:', id);
    
    const response = await fetch(`${BASE_URL}?specDetailId=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Delete error response:', errorData);
      throw new Error(errorData.message || 'Failed to delete spec detail');
    }
    
    const result = await response.json();
    console.log('Delete response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete spec detail');
    }
  } catch (error) {
    console.error('Error deleting spec detail:', error);
    throw error;
  }
}