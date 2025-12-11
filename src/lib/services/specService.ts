import { Specs, CreateSpecRequest, UpdateSpecRequest } from '@/types/specs';

// Base URL for specs API
const BASE_URL = '/api/specs';

// Fetch all specs
export async function fetchSpecs(): Promise<Specs[]> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch specs');
    }
    
    const result = await response.json();
    console.log('API Response:', result); // Debug log
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data && result.data.items) {
      // Transform API response to match Specs type
      return result.data.items.map((item: any) => ({
        specId: item.specId,
        specName: item.specName,
        createdAt: item.createdAt,
        createdBy: 1, // Default value
        updatedAt: item.updatedAt,
        updatedBy: 1, // Default value
        deletedAt: null,
        deletedBy: null
      }));
    } else {
      console.error('Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching specs:', error);
    throw error;
  }
}

// Create spec
export async function createSpec(data: CreateSpecRequest): Promise<Specs> {
  try {
    console.log('Creating spec with data:', data); // Debug log
    
    // Transform data for API
    const apiData = {
      specName: data.specName
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create spec');
    }
    
    const result = await response.json();
    console.log('Create response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform response back to Specs type
      return {
        specId: result.data.specId,
        specName: result.data.specName,
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
    console.error('Error creating spec:', error);
    throw error;
  }
}

// Update spec
export async function updateSpec(id: number, data: UpdateSpecRequest): Promise<Specs> {
  try {
    console.log('Updating spec:', id, data); // Debug log
    
    // Transform data for API
    const apiData = {
      specId: id,
      ...(data.specName !== undefined && { specName: data.specName })
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
      throw new Error(errorData.message || 'Failed to update spec');
    }
    
    const result = await response.json();
    console.log('Update response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform response back to Specs type
      return {
        specId: result.data.specId,
        specName: result.data.specName,
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
    console.error('Error updating spec:', error);
    throw error;
  }
}

// Delete spec
export async function deleteSpec(id: number): Promise<void> {
  try {
    console.log('Deleting spec:', id); // Debug log
    
    // Use specId parameter name to match the API route
    const response = await fetch(`${BASE_URL}?specId=${id}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Delete error response:', errorData); // Debug log
      throw new Error(errorData.message || 'Failed to delete spec');
    }
    
    const result = await response.json();
    console.log('Delete response:', result); // Debug log
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete spec');
    }
  } catch (error) {
    console.error('Error deleting spec:', error);
    throw error;
  }
}