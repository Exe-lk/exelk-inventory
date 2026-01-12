import { GINDetail, CreateGINDetailRequest, UpdateGINDetailRequest } from '@/types/gindetails';

// Base URL for GIN details API
const BASE_URL = '/api/gin/gindetails';

// Fetch all GIN details or filter by GIN ID
export async function fetchGinDetails(ginId?: number): Promise<GINDetail[]> {
  try {
    console.log(' Fetching GIN details...');
    
    let url = BASE_URL;
    
    // Add ginId as query parameter if provided
    if (ginId) {
      url = `${BASE_URL}?ginId=${ginId}`;
      console.log(' Filtering by GIN ID:', ginId);
    }
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GIN details');
    }
    
    const result = await response.json();
    console.log(' GIN Details API Response:', result);
    
    // Handle the response structure
    if (result.status === 'success' && Array.isArray(result.data)) {
      return result.data.map((item: any) => ({
        ginDetailId: item.ginDetailId,
        ginId: item.ginId,
        productId: item.productId,
        quantityIssued: item.quantityIssued,
        unitCost: item.unitCost,
        subTotal: item.subTotal,
        location: item.location
      }));
    } else {
      console.error(' Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching GIN details:', error);
    throw error;
  }
}

// Fetch all details for a specific GIN - using the ginId filter
export async function fetchGinDetailsByGinId(ginId: number): Promise<GINDetail[]> {
  try {
    console.log('🔗 Fetching GIN details for GIN ID:', ginId);
    return await fetchGinDetails(ginId);
  } catch (error) {
    console.error(' Error fetching GIN details by GIN ID:', error);
    throw error;
  }
}

// Fetch single GIN detail by ID
export async function fetchGinDetailById(detailId: number): Promise<GINDetail> {
  try {
    console.log(' Fetching GIN detail with ID:', detailId);
    
    const response = await fetch(`${BASE_URL}/${detailId}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GIN detail');
    }
    
    const result = await response.json();
    console.log(' GIN detail fetch response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        ginDetailId: result.data.ginDetailId,
        ginId: result.data.ginId,
        productId: result.data.productId,
        quantityIssued: result.data.quantityIssued,
        unitCost: result.data.unitCost,
        subTotal: result.data.subTotal,
        location: result.data.location
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching GIN detail:', error);
    throw error;
  }
}

// Create individual GIN detail - Updated to use the new POST format
export async function createGinDetail(data: CreateGINDetailRequest): Promise<GINDetail> {
  try {
    console.log(' Creating individual GIN detail with data:', data);
    
    const apiData = {
      ginId: data.ginId,
      productId: data.productId,
      quantityIssued: data.quantityIssued,
      unitCost: data.unitCost,
      location: data.location
    };

    console.log(' Sending GIN detail data:', apiData);

    // Use the main /api/gin/gindetails endpoint for individual detail creation
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create GIN detail');
    }
    
    const result = await response.json();
    console.log(' Create GIN detail response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        ginDetailId: result.data.ginDetailId,
        ginId: result.data.ginId,
        productId: result.data.productId,
        quantityIssued: result.data.quantityIssued,
        unitCost: result.data.unitCost,
        subTotal: result.data.subTotal,
        location: result.data.location
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error creating GIN detail:', error);
    throw error;
  }
}

// Create GIN detail for specific GIN - DEPRECATED, use createGinDetail instead
export async function createGinDetailForGin(ginId: number, data: Omit<CreateGINDetailRequest, 'ginId'>): Promise<GINDetail> {
  try {
    console.log(' Creating GIN detail for GIN:', ginId, 'with data:', data);
    
    // Convert to full CreateGINDetailRequest format
    const fullData: CreateGINDetailRequest = {
      ginId: ginId,
      productId: data.productId,
      quantityIssued: data.quantityIssued,
      unitCost: data.unitCost,
      location: data.location
    };
    
    return await createGinDetail(fullData);
  } catch (error) {
    console.error(' Error creating GIN detail for GIN:', error);
    throw error;
  }
}

// Update GIN detail
export async function updateGinDetail(detailId: number, data: UpdateGINDetailRequest): Promise<GINDetail> {
  try {
    console.log(' Updating GIN detail:', detailId, data);
    
    const apiData = {
      ...(data.productId !== undefined && { productId: data.productId }),
      ...(data.quantityIssued !== undefined && { quantityIssued: data.quantityIssued }),
      ...(data.unitCost !== undefined && { unitCost: data.unitCost }),
      ...(data.location !== undefined && { location: data.location })
    };

    console.log(' Sending update data:', apiData);

    const response = await fetch(`${BASE_URL}/${detailId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Update error response:', errorData);
      throw new Error(errorData.message || 'Failed to update GIN detail');
    }
    
    const result = await response.json();
    console.log(' Update response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        ginDetailId: result.data.ginDetailId,
        ginId: result.data.ginId,
        productId: result.data.productId,
        quantityIssued: result.data.quantityIssued,
        unitCost: result.data.unitCost,
        subTotal: result.data.subTotal,
        location: result.data.location
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error updating GIN detail:', error);
    throw error;
  }
}

// Delete GIN detail
export async function deleteGinDetail(detailId: number): Promise<void> {
  try {
    console.log(' Deleting GIN detail:', detailId);
    
    const response = await fetch(`${BASE_URL}/${detailId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Delete error response:', errorData);
      throw new Error(errorData.message || 'Failed to delete GIN detail');
    }
    
    const result = await response.json();
    console.log(' Delete response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete GIN detail');
    }
  } catch (error) {
    console.error(' Error deleting GIN detail:', error);
    throw error;
  }
}

// Batch create GIN details - Create multiple details for a GIN at once
export async function createMultipleGinDetails(ginId: number, details: Omit<CreateGINDetailRequest, 'ginId'>[]): Promise<GINDetail[]> {
  try {
    console.log(' Creating multiple GIN details for GIN:', ginId, details);
    
    const createdDetails: GINDetail[] = [];
    
    // Create details one by one (could be optimized with batch endpoint if available)
    for (const detail of details) {
      const fullData: CreateGINDetailRequest = {
        ginId: ginId,
        productId: detail.productId,
        quantityIssued: detail.quantityIssued,
        unitCost: detail.unitCost,
        location: detail.location
      };
      
      const createdDetail = await createGinDetail(fullData);
      createdDetails.push(createdDetail);
    }
    
    console.log(' Created multiple GIN details:', createdDetails.length);
    return createdDetails;
  } catch (error) {
    console.error(' Error creating multiple GIN details:', error);
    throw error;
  }
}

// Batch update GIN details for a specific GIN
export async function updateMultipleGinDetails(updates: { detailId: number; data: UpdateGINDetailRequest }[]): Promise<GINDetail[]> {
  try {
    console.log(' Updating multiple GIN details:', updates);
    
    const updatedDetails: GINDetail[] = [];
    
    // Update details one by one
    for (const update of updates) {
      const updatedDetail = await updateGinDetail(update.detailId, update.data);
      updatedDetails.push(updatedDetail);
    }
    
    console.log(' Updated multiple GIN details:', updatedDetails.length);
    return updatedDetails;
  } catch (error) {
    console.error(' Error updating multiple GIN details:', error);
    throw error;
  }
}

// Delete all GIN details for a specific GIN
export async function deleteAllGinDetailsForGin(ginId: number): Promise<void> {
  try {
    console.log(' Deleting all GIN details for GIN:', ginId);
    
    // First fetch all details for this GIN
    const details = await fetchGinDetailsByGinId(ginId);
    
    // Delete each detail
    for (const detail of details) {
      await deleteGinDetail(detail.ginDetailId);
    }
    
    console.log(' Deleted all GIN details for GIN:', ginId);
  } catch (error) {
    console.error(' Error deleting all GIN details:', error);
    throw error;
  }
}

// Calculate total amount for a GIN based on its details
export async function calculateGinTotal(ginId: number): Promise<number> {
  try {
    console.log(' Calculating total for GIN:', ginId);
    
    const details = await fetchGinDetailsByGinId(ginId);
    
    const total = details.reduce((sum, detail) => {
      return sum + (detail.subTotal || 0);
    }, 0);
    
    console.log(' Calculated GIN total:', total);
    return total;
  } catch (error) {
    console.error(' Error calculating GIN total:', error);
    throw error;
  }
}

// Get GIN detail statistics
export async function getGinDetailStatistics(ginId?: number): Promise<{
  totalDetails: number;
  totalQuantity: number;
  totalValue: number;
  avgUnitCost: number;
}> {
  try {
    console.log(' Fetching GIN detail statistics for GIN:', ginId);
    
    const details = ginId ? await fetchGinDetailsByGinId(ginId) : await fetchGinDetails();
    
    const totalDetails = details.length;
    const totalQuantity = details.reduce((sum, detail) => sum + detail.quantityIssued, 0);
    const totalValue = details.reduce((sum, detail) => sum + (detail.subTotal || 0), 0);
    const avgUnitCost = totalDetails > 0 ? details.reduce((sum, detail) => sum + detail.unitCost, 0) / totalDetails : 0;
    
    const statistics = {
      totalDetails,
      totalQuantity,
      totalValue,
      avgUnitCost: Math.round(avgUnitCost * 100) / 100 // Round to 2 decimal places
    };
    
    console.log(' GIN detail statistics:', statistics);
    return statistics;
  } catch (error) {
    console.error(' Error fetching GIN detail statistics:', error);
    throw error;
  }
}

// Validate GIN detail data
export function validateGinDetailData(data: Partial<CreateGINDetailRequest>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.ginId || data.ginId <= 0) {
    errors.push('Valid GIN ID is required');
  }
  
  if (!data.productId || data.productId <= 0) {
    errors.push('Valid Product ID is required');
  }
  
  if (!data.quantityIssued || data.quantityIssued <= 0) {
    errors.push('Quantity issued must be greater than 0');
  }
  
  if (!data.unitCost || data.unitCost <= 0) {
    errors.push('Unit cost must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}