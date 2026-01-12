// import { GRNDetail, CreateGRNDetailRequest, UpdateGRNDetailRequest } from '@/types/grndetails';

// // Base URL for GRN details API
// const BASE_URL = '/api/grn/details';

// // Fetch all details for a specific GRN
// export async function fetchGrnDetails(grnId: number): Promise<GRNDetail[]> {
//   try {
//     // This would use the /api/grn/{id}/details endpoint if it exists
//     // For now, we'll use the details endpoint with filtering
//     const response = await fetch(`${BASE_URL}?grnId=${grnId}`, {
//       method: 'GET',
//       credentials: 'include',
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to fetch GRN details');
//     }
    
//     const result = await response.json();
//     console.log('API Response:', result);
    
//     // Handle the response structure
//     if (result.status === 'success' && Array.isArray(result.data)) {
//       return result.data.map((item: any) => ({
//         grnDetailId: item.grnDetailId,
//         grnId: item.grnId,
//         productId: item.productId,
//         quantityReceived: item.quantityReceived,
//         unitCost: item.unitCost,
//         subTotal: item.subTotal,
//         location: item.location
//       }));
//     } else {
//       console.error('Invalid response format:', result);
//       throw new Error('Invalid response format');
//     }
//   } catch (error) {
//     console.error('Error fetching GRN details:', error);
//     throw error;
//   }
// }

// // Fetch single GRN detail by ID
// export async function fetchGrnDetailById(detailId: number): Promise<GRNDetail> {
//   try {
//     console.log('Fetching GRN detail with ID:', detailId);
    
//     const response = await fetch(`${BASE_URL}/${detailId}`, {
//       method: 'GET',
//       credentials: 'include',
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to fetch GRN detail');
//     }
    
//     const result = await response.json();
//     console.log('GRN detail fetch response:', result);
    
//     if (result.status === 'success' && result.data) {
//       return {
//         grnDetailId: result.data.grnDetailId,
//         grnId: result.data.grnId,
//         productId: result.data.productId,
//         quantityReceived: result.data.quantityReceived,
//         unitCost: result.data.unitCost,
//         subTotal: result.data.subTotal,
//         location: result.data.location
//       };
//     } else {
//       throw new Error(result.message || 'Invalid response format');
//     }
//   } catch (error) {
//     console.error('Error fetching GRN detail:', error);
//     throw error;
//   }
// }

// // Create GRN detail - Add to specific GRN
// export async function createGrnDetail(grnId: number, data: Omit<CreateGRNDetailRequest, 'grnId'>): Promise<GRNDetail> {
//   try {
//     console.log('Creating GRN detail for GRN:', grnId, 'with data:', data);
    
//     const apiData = {
//       productId: data.productId,
//       quantityReceived: data.quantityReceived,
//       unitCost: data.unitCost,
//       location: data.location
//     };

//     // Use the /api/grn/{id}/details endpoint for adding details to a specific GRN
//     const response = await fetch(`/api/grn/${grnId}/details`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify(apiData),
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to create GRN detail');
//     }
    
//     const result = await response.json();
//     console.log('Create response:', result);
    
//     if (result.status === 'success' && result.data) {
//       return {
//         grnDetailId: result.data.grnDetailId,
//         grnId: result.data.grnId,
//         productId: result.data.productId,
//         quantityReceived: result.data.quantityReceived,
//         unitCost: result.data.unitCost,
//         subTotal: result.data.subTotal,
//         location: result.data.location
//       };
//     } else {
//       throw new Error(result.message || 'Invalid response format');
//     }
//   } catch (error) {
//     console.error('Error creating GRN detail:', error);
//     throw error;
//   }
// }

// // Update GRN detail
// export async function updateGrnDetail(detailId: number, data: UpdateGRNDetailRequest): Promise<GRNDetail> {
//   try {
//     console.log('Updating GRN detail:', detailId, data);
    
//     const apiData = {
//       ...(data.productId !== undefined && { productId: data.productId }),
//       ...(data.quantityReceived !== undefined && { quantityReceived: data.quantityReceived }),
//       ...(data.unitCost !== undefined && { unitCost: data.unitCost }),
//       ...(data.location !== undefined && { location: data.location })
//     };

//     console.log('Sending update data:', apiData);

//     const response = await fetch(`${BASE_URL}/${detailId}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify(apiData),
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error('Update error response:', errorData);
//       throw new Error(errorData.message || 'Failed to update GRN detail');
//     }
    
//     const result = await response.json();
//     console.log('Update response:', result);
    
//     if (result.status === 'success' && result.data) {
//       return {
//         grnDetailId: result.data.grnDetailId,
//         grnId: result.data.grnId,
//         productId: result.data.productId,
//         quantityReceived: result.data.quantityReceived,
//         unitCost: result.data.unitCost,
//         subTotal: result.data.subTotal,
//         location: result.data.location
//       };
//     } else {
//       throw new Error(result.message || 'Invalid response format');
//     }
//   } catch (error) {
//     console.error('Error updating GRN detail:', error);
//     throw error;
//   }
// }

// // Delete GRN detail
// export async function deleteGrnDetail(detailId: number): Promise<void> {
//   try {
//     console.log('Deleting GRN detail:', detailId);
    
//     const response = await fetch(`${BASE_URL}/${detailId}`, {
//       method: 'DELETE',
//       credentials: 'include',
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error('Delete error response:', errorData);
//       throw new Error(errorData.message || 'Failed to delete GRN detail');
//     }
    
//     const result = await response.json();
//     console.log('Delete response:', result);
    
//     if (result.status !== 'success') {
//       throw new Error(result.message || 'Failed to delete GRN detail');
//     }
//   } catch (error) {
//     console.error('Error deleting GRN detail:', error);
//     throw error;
//   }
// }

// // Batch create GRN details - Add multiple details to a GRN at once
// export async function createMultipleGrnDetails(grnId: number, details: Omit<CreateGRNDetailRequest, 'grnId'>[]): Promise<GRNDetail[]> {
//   try {
//     console.log('Creating multiple GRN details for GRN:', grnId, details);
    
//     const createdDetails: GRNDetail[] = [];
    
//     // Create details one by one (could be optimized with batch endpoint if available)
//     for (const detail of details) {
//       const createdDetail = await createGrnDetail(grnId, detail);
//       createdDetails.push(createdDetail);
//     }
    
//     return createdDetails;
//   } catch (error) {
//     console.error('Error creating multiple GRN details:', error);
//     throw error;
//   }
// }




import { GRNDetail, CreateGRNDetailRequest, UpdateGRNDetailRequest } from '@/types/grndetails';

// Base URL for GRN details API
const BASE_URL = '/api/grn/grndetails';

// Fetch all GRN details or filter by GRN ID
export async function fetchGrnDetails(grnId?: number): Promise<GRNDetail[]> {
  try {
    console.log(' Fetching GRN details...');
    
    let url = BASE_URL;
    
    // Add grnId as query parameter if provided
    if (grnId) {
      url = `${BASE_URL}?grnId=${grnId}`;
      console.log(' Filtering by GRN ID:', grnId);
    }
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GRN details');
    }
    
    const result = await response.json();
    console.log(' GRN Details API Response:', result);
    
    // Handle the response structure
    if (result.status === 'success' && Array.isArray(result.data)) {
      return result.data.map((item: any) => ({
        grnDetailId: item.grnDetailId,
        grnId: item.grnId,
        productId: item.productId,
        quantityReceived: item.quantityReceived,
        unitCost: item.unitCost,
        subTotal: item.subTotal,
        location: item.location
      }));
    } else {
      console.error(' Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching GRN details:', error);
    throw error;
  }
}

// Fetch all details for a specific GRN - using the grnId filter
export async function fetchGrnDetailsByGrnId(grnId: number): Promise<GRNDetail[]> {
  try {
    console.log('🔗 Fetching GRN details for GRN ID:', grnId);
    return await fetchGrnDetails(grnId);
  } catch (error) {
    console.error(' Error fetching GRN details by GRN ID:', error);
    throw error;
  }
}

// Fetch single GRN detail by ID
export async function fetchGrnDetailById(detailId: number): Promise<GRNDetail> {
  try {
    console.log(' Fetching GRN detail with ID:', detailId);
    
    const response = await fetch(`${BASE_URL}/${detailId}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GRN detail');
    }
    
    const result = await response.json();
    console.log(' GRN detail fetch response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        grnDetailId: result.data.grnDetailId,
        grnId: result.data.grnId,
        productId: result.data.productId,
        quantityReceived: result.data.quantityReceived,
        unitCost: result.data.unitCost,
        subTotal: result.data.subTotal,
        location: result.data.location
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching GRN detail:', error);
    throw error;
  }
}

// Create individual GRN detail - Updated to use the new POST format
export async function createGrnDetail(data: CreateGRNDetailRequest): Promise<GRNDetail> {
  try {
    console.log(' Creating individual GRN detail with data:', data);
    
    const apiData = {
      grnId: data.grnId,
      productId: data.productId,
      quantityReceived: data.quantityReceived,
      unitCost: data.unitCost,
      location: data.location
    };

    console.log(' Sending GRN detail data:', apiData);

    // Use the main /api/grn/details endpoint for individual detail creation
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create GRN detail');
    }
    
    const result = await response.json();
    console.log(' Create GRN detail response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        grnDetailId: result.data.grnDetailId,
        grnId: result.data.grnId,
        productId: result.data.productId,
        quantityReceived: result.data.quantityReceived,
        unitCost: result.data.unitCost,
        subTotal: result.data.subTotal,
        location: result.data.location
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error creating GRN detail:', error);
    throw error;
  }
}

// Create GRN detail for specific GRN - DEPRECATED, use createGrnDetail instead
export async function createGrnDetailForGrn(grnId: number, data: Omit<CreateGRNDetailRequest, 'grnId'>): Promise<GRNDetail> {
  try {
    console.log(' Creating GRN detail for GRN:', grnId, 'with data:', data);
    
    // Convert to full CreateGRNDetailRequest format
    const fullData: CreateGRNDetailRequest = {
      grnId: grnId,
      productId: data.productId,
      quantityReceived: data.quantityReceived,
      unitCost: data.unitCost,
      location: data.location
    };
    
    return await createGrnDetail(fullData);
  } catch (error) {
    console.error(' Error creating GRN detail for GRN:', error);
    throw error;
  }
}

// Update GRN detail
export async function updateGrnDetail(detailId: number, data: UpdateGRNDetailRequest): Promise<GRNDetail> {
  try {
    console.log(' Updating GRN detail:', detailId, data);
    
    const apiData = {
      ...(data.productId !== undefined && { productId: data.productId }),
      ...(data.quantityReceived !== undefined && { quantityReceived: data.quantityReceived }),
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
      throw new Error(errorData.message || 'Failed to update GRN detail');
    }
    
    const result = await response.json();
    console.log(' Update response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        grnDetailId: result.data.grnDetailId,
        grnId: result.data.grnId,
        productId: result.data.productId,
        quantityReceived: result.data.quantityReceived,
        unitCost: result.data.unitCost,
        subTotal: result.data.subTotal,
        location: result.data.location
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error updating GRN detail:', error);
    throw error;
  }
}

// Delete GRN detail
export async function deleteGrnDetail(detailId: number): Promise<void> {
  try {
    console.log('🔗 Deleting GRN detail:', detailId);
    
    const response = await fetch(`${BASE_URL}/${detailId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Delete error response:', errorData);
      throw new Error(errorData.message || 'Failed to delete GRN detail');
    }
    
    const result = await response.json();
    console.log(' Delete response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete GRN detail');
    }
  } catch (error) {
    console.error(' Error deleting GRN detail:', error);
    throw error;
  }
}

// Batch create GRN details - Create multiple details for a GRN at once
export async function createMultipleGrnDetails(grnId: number, details: Omit<CreateGRNDetailRequest, 'grnId'>[]): Promise<GRNDetail[]> {
  try {
    console.log(' Creating multiple GRN details for GRN:', grnId, details);
    
    const createdDetails: GRNDetail[] = [];
    
    // Create details one by one (could be optimized with batch endpoint if available)
    for (const detail of details) {
      const fullData: CreateGRNDetailRequest = {
        grnId: grnId,
        productId: detail.productId,
        quantityReceived: detail.quantityReceived,
        unitCost: detail.unitCost,
        location: detail.location
      };
      
      const createdDetail = await createGrnDetail(fullData);
      createdDetails.push(createdDetail);
    }
    
    console.log(' Created multiple GRN details:', createdDetails.length);
    return createdDetails;
  } catch (error) {
    console.error(' Error creating multiple GRN details:', error);
    throw error;
  }
}

// Batch update GRN details for a specific GRN
export async function updateMultipleGrnDetails(updates: { detailId: number; data: UpdateGRNDetailRequest }[]): Promise<GRNDetail[]> {
  try {
    console.log(' Updating multiple GRN details:', updates);
    
    const updatedDetails: GRNDetail[] = [];
    
    // Update details one by one
    for (const update of updates) {
      const updatedDetail = await updateGrnDetail(update.detailId, update.data);
      updatedDetails.push(updatedDetail);
    }
    
    console.log(' Updated multiple GRN details:', updatedDetails.length);
    return updatedDetails;
  } catch (error) {
    console.error(' Error updating multiple GRN details:', error);
    throw error;
  }
}

// Delete all GRN details for a specific GRN
export async function deleteAllGrnDetailsForGrn(grnId: number): Promise<void> {
  try {
    console.log(' Deleting all GRN details for GRN:', grnId);
    
    // First fetch all details for this GRN
    const details = await fetchGrnDetailsByGrnId(grnId);
    
    // Delete each detail
    for (const detail of details) {
      await deleteGrnDetail(detail.grnDetailId);
    }
    
    console.log(' Deleted all GRN details for GRN:', grnId);
  } catch (error) {
    console.error(' Error deleting all GRN details:', error);
    throw error;
  }
}