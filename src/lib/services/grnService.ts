// import { GRN, CreateGRNRequest, UpdateGRNRequest } from '@/types/grn';



// // Base URL for GRN API
// const BASE_URL = '/api/grn';

// // Fetch all GRN records
// export async function fetchGrns(): Promise<GRN[]> {
//   try {
//     const response = await fetch(BASE_URL, {
//       method: 'GET',
//       credentials: 'include',
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to fetch GRN records');
//     }
    
//     const result = await response.json();
//     console.log('API Response:', result);
    
//     // Handle the nested response structure
//     if (result.status === 'success' && result.data && result.data.items) {
//       return result.data.items.map((item: any) => ({
//         grnId: item.grnId,
//         grnNumber: item.grnNumber,
//         supplierId: item.supplierId,
//         stockKeeperId: item.stockKeeperId,
//         receivedDate: item.receivedDate,
//         totalAmount: item.totalAmount,
//         remarks: item.remarks
//       }));
//     } else {
//       console.error('Invalid response format:', result);
//       throw new Error('Invalid response format');
//     }
//   } catch (error) {
//     console.error('Error fetching GRN records:', error);
//     throw error;
//   }
// }

// // Fetch GRN with filters and pagination
// export async function fetchGrnsWithParams(params: {
//   page?: number
//   limit?: number
//   sortBy?: string
//   sortOrder?: 'asc' | 'desc'
//   search?: string
//   supplierId?: number
//   stockKeeperId?: number
//   minAmount?: number
//   maxAmount?: number
// }): Promise<{
//   items: GRN[]
//   pagination: any
//   sorting: any
//   search: string | null
//   filters: any
// }> {
//   try {
//     const queryParams = new URLSearchParams();
    
//     if (params.page) queryParams.set('page', params.page.toString());
//     if (params.limit) queryParams.set('limit', params.limit.toString());
//     if (params.sortBy) queryParams.set('sortBy', params.sortBy);
//     if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
//     if (params.search) queryParams.set('search', params.search);
//     if (params.supplierId) queryParams.set('supplierId', params.supplierId.toString());
//     if (params.stockKeeperId) queryParams.set('stockKeeperId', params.stockKeeperId.toString());
//     if (params.minAmount) queryParams.set('minAmount', params.minAmount.toString());
//     if (params.maxAmount) queryParams.set('maxAmount', params.maxAmount.toString());

//     const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;
    
//     const response = await fetch(url, {
//       method: 'GET',
//       credentials: 'include',
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to fetch GRN records');
//     }
    
//     const result = await response.json();
//     console.log('API Response:', result);
    
//     if (result.status === 'success' && result.data) {
//       return {
//         items: result.data.items.map((item: any) => ({
//           grnId: item.grnId,
//           grnNumber: item.grnNumber,
//           supplierId: item.supplierId,
//           stockKeeperId: item.stockKeeperId,
//           receivedDate: item.receivedDate,
//           totalAmount: item.totalAmount,
//           remarks: item.remarks
//         })),
//         pagination: result.data.pagination,
//         sorting: result.data.sorting,
//         search: result.data.search,
//         filters: result.data.filters
//       };
//     } else {
//       throw new Error('Invalid response format');
//     }
//   } catch (error) {
//     console.error('Error fetching GRN records with params:', error);
//     throw error;
//   }
// }

// // Fetch single GRN by ID
// export async function fetchGrnById(id: number): Promise<GRN> {
//   try {
//     console.log('Fetching GRN with ID:', id);
    
//     const response = await fetch(`${BASE_URL}/${id}`, {
//       method: 'GET',
//       credentials: 'include',
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to fetch GRN');
//     }
    
//     const result = await response.json();
//     console.log('GRN fetch response:', result);
    
//     if (result.status === 'success' && result.data) {
//       return {
//         grnId: result.data.grnId,
//         grnNumber: result.data.grnNumber,
//         supplierId: result.data.supplierId,
//         stockKeeperId: result.data.stockKeeperId,
//         receivedDate: result.data.receivedDate,
//         totalAmount: result.data.totalAmount,
//         remarks: result.data.remarks
//       };
//     } else {
//       throw new Error(result.message || 'Invalid response format');
//     }
//   } catch (error) {
//     console.error('Error fetching GRN:', error);
//     throw error;
//   }
// }

// // Create GRN
// export async function createGrn(data: CreateGRNRequest): Promise<GRN> {
//   try {
//     console.log('Creating GRN with data:', data);
    
//     const apiData = {
//       grnNumber: data.grnNumber,
//       supplierId: data.supplierId,
//       stockKeeperId: data.stockKeeperId,
//       receivedDate: data.receivedDate,
//       totalAmount: data.totalAmount,
//       remarks: data.remarks
//     };

//     const response = await fetch(BASE_URL, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify(apiData),
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to create GRN');
//     }
    
//     const result = await response.json();
//     console.log('Create response:', result);
    
//     if (result.status === 'success' && result.data) {
//       return {
//         grnId: result.data.grnId,
//         grnNumber: result.data.grnNumber,
//         supplierId: result.data.supplierId,
//         stockKeeperId: result.data.stockKeeperId,
//         receivedDate: result.data.receivedDate,
//         totalAmount: result.data.totalAmount,
//         remarks: result.data.remarks
//       };
//     } else {
//       throw new Error(result.message || 'Invalid response format');
//     }
//   } catch (error) {
//     console.error('Error creating GRN:', error);
//     throw error;
//   }
// }

// // Update GRN
// export async function updateGrn(id: number, data: UpdateGRNRequest): Promise<GRN> {
//   try {
//     console.log('Updating GRN:', id, data);
    
//     const apiData = {
//       ...(data.grnNumber !== undefined && { grnNumber: data.grnNumber }),
//       ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
//       ...(data.stockKeeperId !== undefined && { stockKeeperId: data.stockKeeperId }),
//       ...(data.receivedDate !== undefined && { receivedDate: data.receivedDate }),
//       ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
//       ...(data.remarks !== undefined && { remarks: data.remarks })
//     };

//     console.log('Sending update data:', apiData);

//     const response = await fetch(`${BASE_URL}/${id}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify(apiData),
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error('Update error response:', errorData);
//       throw new Error(errorData.message || 'Failed to update GRN');
//     }
    
//     const result = await response.json();
//     console.log('Update response:', result);
    
//     if (result.status === 'success' && result.data) {
//       return {
//         grnId: result.data.grnId,
//         grnNumber: result.data.grnNumber,
//         supplierId: result.data.supplierId,
//         stockKeeperId: result.data.stockKeeperId,
//         receivedDate: result.data.receivedDate,
//         totalAmount: result.data.totalAmount,
//         remarks: result.data.remarks
//       };
//     } else {
//       throw new Error(result.message || 'Invalid response format');
//     }
//   } catch (error) {
//     console.error('Error updating GRN:', error);
//     throw error;
//   }
// }

// // Delete GRN
// export async function deleteGrn(id: number): Promise<void> {
//   try {
//     console.log('Deleting GRN:', id);
    
//     const response = await fetch(`${BASE_URL}/${id}`, {
//       method: 'DELETE',
//       credentials: 'include',
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error('Delete error response:', errorData);
//       throw new Error(errorData.message || 'Failed to delete GRN');
//     }
    
//     const result = await response.json();
//     console.log('Delete response:', result);
    
//     if (result.status !== 'success') {
//       throw new Error(result.message || 'Failed to delete GRN');
//     }
//   } catch (error) {
//     console.error('Error deleting GRN:', error);
//     throw error;
//   }
// }






import { GRN, CreateGRNRequest, UpdateGRNRequest } from '@/types/grn';

// Base URL for GRN API
const BASE_URL = '/api/grn';

// Create Complete GRN request interface for the new POST endpoint
export interface CreateCompleteGRNRequest {
  grnNumber: string;
  supplierId: number;
  receivedDate: string;
  totalAmount?: number;
  remarks?: string;
  stockId?: number;
  grnDetails: {
    productId: number;
    quantityReceived: number;
    unitCost: number;
    location?: number;
  }[];
}

// Fetch all GRN records
export async function fetchGrns(): Promise<GRN[]> {
  try {
    console.log(' Fetching all GRN records...');
    
    const response = await fetch(BASE_URL, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GRN records');
    }
    
    const result = await response.json();
    console.log(' API Response:', result);
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data && result.data.items) {
      return result.data.items.map((item: any) => ({
        grnId: item.grnId,
        grnNumber: item.grnNumber,
        supplierId: item.supplierId,
        stockKeeperId: item.stockKeeperId,
        receivedDate: item.receivedDate,
        totalAmount: item.totalAmount,
        remarks: item.remarks,
        createdDate: item.createdDate,
        updatedDate: item.updatedDate
      }));
    } else {
      console.error(' Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching GRN records:', error);
    throw error;
  }
}

// Fetch GRN with filters and pagination
export async function fetchGrnsWithParams(params: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  supplierId?: number
  stockKeeperId?: number
  minAmount?: number
  maxAmount?: number
}): Promise<{
  items: GRN[]
  pagination: any
  sorting: any
  search: string | null
  filters: any
}> {
  try {
    console.log(' Fetching GRNs with parameters:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.search) queryParams.set('search', params.search);
    if (params.supplierId) queryParams.set('supplierId', params.supplierId.toString());
    if (params.stockKeeperId) queryParams.set('stockKeeperId', params.stockKeeperId.toString());
    if (params.minAmount) queryParams.set('minAmount', params.minAmount.toString());
    if (params.maxAmount) queryParams.set('maxAmount', params.maxAmount.toString());

    const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;
    console.log(' Request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GRN records');
    }
    
    const result = await response.json();
    console.log(' API Response with params:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        items: result.data.items.map((item: any) => ({
          grnId: item.grnId,
          grnNumber: item.grnNumber,
          supplierId: item.supplierId,
          stockKeeperId: item.stockKeeperId,
          receivedDate: item.receivedDate,
          totalAmount: item.totalAmount,
          remarks: item.remarks,
          createdDate: item.createdDate,
          updatedDate: item.updatedDate
        })),
        pagination: result.data.pagination,
        sorting: result.data.sorting,
        search: result.data.search,
        filters: result.data.filters
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching GRN records with params:', error);
    throw error;
  }
}

// Fetch single GRN by ID - Updated to use query parameter
export async function fetchGrnById(id: number): Promise<GRN> {
  try {
    console.log(' Fetching GRN with ID:', id);
    
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GRN');
    }
    
    const result = await response.json();
    console.log(' GRN fetch response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        grnId: result.data.grnId,
        grnNumber: result.data.grnNumber,
        supplierId: result.data.supplierId,
        stockKeeperId: result.data.stockKeeperId,
        receivedDate: result.data.receivedDate,
        totalAmount: result.data.totalAmount,
        remarks: result.data.remarks,
        createdDate: result.data.createdDate,
        updatedDate: result.data.updatedDate
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching GRN:', error);
    throw error;
  }
}

// Create simple GRN (basic fields only)
export async function createGrn(data: CreateGRNRequest): Promise<GRN> {
  try {
    console.log(' Creating simple GRN with data:', data);
    
    const apiData = {
      grnNumber: data.grnNumber,
      supplierId: data.supplierId,
      stockKeeperId: data.stockKeeperId,
      receivedDate: data.receivedDate,
      totalAmount: data.totalAmount,
      remarks: data.remarks
    };

    console.log(' Sending GRN data:', apiData);

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create GRN');
    }
    
    const result = await response.json();
    console.log(' Create response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        grnId: result.data.grnId,
        grnNumber: result.data.grnNumber,
        supplierId: result.data.supplierId,
        stockKeeperId: result.data.stockKeeperId,
        receivedDate: result.data.receivedDate,
        totalAmount: result.data.totalAmount,
        remarks: result.data.remarks
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error creating GRN:', error);
    throw error;
  }
}

// Create complete GRN with details - NEW METHOD
export async function createCompleteGrn(data: CreateCompleteGRNRequest): Promise<{
  grn: GRN;
  grnDetails: any[];
  totalDetailsCreated: number;
  calculatedTotalAmount: number;
}> {
  try {
    console.log(' Creating complete GRN with data:', data);
    
    const apiData = {
      grnNumber: data.grnNumber,
      supplierId: data.supplierId,
      receivedDate: data.receivedDate,
      totalAmount: data.totalAmount,
      remarks: data.remarks,
      stockId: data.stockId,
      grnDetails: data.grnDetails
    };

    console.log(' Sending complete GRN data:', JSON.stringify(apiData, null, 2));

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create complete GRN');
    }
    
    const result = await response.json();
    console.log(' Complete GRN create response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        grn: {
          grnId: result.data.grn.grnId,
          grnNumber: result.data.grn.grnNumber,
          supplierId: result.data.grn.supplierId,
          stockKeeperId: result.data.grn.stockKeeperId,
          receivedDate: result.data.grn.receivedDate,
          totalAmount: result.data.grn.totalAmount,
          remarks: result.data.grn.remarks
        },
        grnDetails: result.data.grnDetails,
        totalDetailsCreated: result.data.totalDetailsCreated,
        calculatedTotalAmount: result.data.calculatedTotalAmount
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error creating complete GRN:', error);
    throw error;
  }
}

// Update GRN - Updated to use query parameter
export async function updateGrn(id: number, data: UpdateGRNRequest): Promise<GRN> {
  try {
    console.log(' Updating GRN:', id, data);
    
    const apiData = {
      ...(data.grnNumber !== undefined && { grnNumber: data.grnNumber }),
      ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
      ...(data.stockKeeperId !== undefined && { stockKeeperId: data.stockKeeperId }),
      ...(data.receivedDate !== undefined && { receivedDate: data.receivedDate }),
      ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
      ...(data.remarks !== undefined && { remarks: data.remarks })
    };

    console.log(' Sending update data:', apiData);

    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Update error response:', errorData);
      throw new Error(errorData.message || 'Failed to update GRN');
    }
    
    const result = await response.json();
    console.log(' Update response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        grnId: result.data.grnId,
        grnNumber: result.data.grnNumber,
        supplierId: result.data.supplierId,
        stockKeeperId: result.data.stockKeeperId,
        receivedDate: result.data.receivedDate,
        totalAmount: result.data.totalAmount,
        remarks: result.data.remarks
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error updating GRN:', error);
    throw error;
  }
}

// Delete GRN - Updated to use query parameter
export async function deleteGrn(id: number): Promise<void> {
  try {
    console.log(' Deleting GRN:', id);
    
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Delete error response:', errorData);
      throw new Error(errorData.message || 'Failed to delete GRN');
    }
    
    const result = await response.json();
    console.log(' Delete response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete GRN');
    }
  } catch (error) {
    console.error(' Error deleting GRN:', error);
    throw error;
  }
}