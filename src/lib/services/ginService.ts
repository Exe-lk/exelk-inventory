import { GIN, CreateGINRequest, UpdateGINRequest } from '@/types/gin';

// Base URL for GIN API
const BASE_URL = '/api/gin';

// Create Complete GIN request interface for the new POST endpoint
export interface CreateCompleteGINRequest {
  ginNumber: string;
  issuedTo: string;
  issueReason?: string;
  issueDate: string;
  remarks?: string;
  stockId?: number;
  ginDetails: {
    productId: number;
    quantityIssued: number;
    unitCost: number;
    location?: string;
  }[];
}

// Fetch all GIN records
export async function fetchGins(): Promise<GIN[]> {
  try {
    console.log('🔗 Fetching all GIN records...');
    
    const response = await fetch(BASE_URL, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GIN records');
    }
    
    const result = await response.json();
    console.log('📋 API Response:', result);
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data && result.data.items) {
      return result.data.items.map((item: any) => ({
        ginId: item.ginId,
        ginNumber: item.ginNumber,
        stockKeeperId: item.stockKeeperId,
        issuedTo: item.issuedTo,
        issueReason: item.issueReason,
        issueDate: item.issueDate,
        remarks: item.remarks,
        stockId: item.stockId,
        createdDate: item.createdAt,
        updatedDate: item.updatedAt
      }));
    } else {
      console.error('❌ Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('❌ Error fetching GIN records:', error);
    throw error;
  }
}

// Fetch GIN with filters and pagination
export async function fetchGinsWithParams(params: {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  issuedTo?: string
  stockKeeperId?: number
  issueReason?: string
}): Promise<{
  items: GIN[]
  pagination: any
  sorting: any
  search: string | null
  filters: any
}> {
  try {
    console.log('🔗 Fetching GINs with parameters:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.search) queryParams.set('search', params.search);
    if (params.issuedTo) queryParams.set('issuedTo', params.issuedTo);
    if (params.stockKeeperId) queryParams.set('stockKeeperId', params.stockKeeperId.toString());
    if (params.issueReason) queryParams.set('issueReason', params.issueReason);

    const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;
    console.log('🔗 Request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GIN records');
    }
    
    const result = await response.json();
    console.log('📋 API Response with params:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        items: result.data.items.map((item: any) => ({
          ginId: item.ginId,
          ginNumber: item.ginNumber,
          stockKeeperId: item.stockKeeperId,
          issuedTo: item.issuedTo,
          issueReason: item.issueReason,
          issueDate: item.issueDate,
          remarks: item.remarks,
          stockId: item.stockId,
          createdDate: item.createdAt,
          updatedDate: item.updatedAt
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
    console.error('❌ Error fetching GIN records with params:', error);
    throw error;
  }
}

// Fetch single GIN by ID - Updated to use query parameter
export async function fetchGinById(id: number): Promise<GIN> {
  try {
    console.log('🔗 Fetching GIN with ID:', id);
    
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch GIN');
    }
    
    const result = await response.json();
    console.log('📋 GIN fetch response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        ginId: result.data.ginId,
        ginNumber: result.data.ginNumber,
        stockKeeperId: result.data.stockKeeperId,
        issuedTo: result.data.issuedTo,
        issueReason: result.data.issueReason,
        issueDate: result.data.issueDate,
        remarks: result.data.remarks,
        stockId: result.data.stockId,
        createdDate: result.data.createdAt,
        updatedDate: result.data.updatedAt
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('❌ Error fetching GIN:', error);
    throw error;
  }
}

// Create simple GIN (basic fields only)
export async function createGin(data: CreateGINRequest): Promise<GIN> {
  try {
    console.log('🔗 Creating simple GIN with data:', data);
    
    const apiData = {
      ginNumber: data.ginNumber,
      issuedTo: data.issuedTo,
      issueReason: data.issueReason,
      issueDate: data.issueDate,
      remarks: data.remarks,
      stockId: data.stockId
    };

    console.log('📤 Sending GIN data:', apiData);

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create GIN');
    }
    
    const result = await response.json();
    console.log('✅ Create response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        ginId: result.data.ginId,
        ginNumber: result.data.ginNumber,
        stockKeeperId: result.data.stockKeeperId,
        issuedTo: result.data.issuedTo,
        issueReason: result.data.issueReason,
        issueDate: result.data.issueDate,
        remarks: result.data.remarks,
        stockId: result.data.stockId
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('❌ Error creating GIN:', error);
    throw error;
  }
}

// Create complete GIN with details - NEW METHOD
export async function createCompleteGin(data: CreateCompleteGINRequest): Promise<{
  gin: GIN;
  ginDetails: any[];
  totalDetailsCreated: number;
}> {
  try {
    console.log('🔗 Creating complete GIN with data:', data);
    
    const apiData = {
      ginNumber: data.ginNumber,
      issuedTo: data.issuedTo,
      issueReason: data.issueReason,
      issueDate: data.issueDate,
      remarks: data.remarks,
      stockId: data.stockId,
      ginDetails: data.ginDetails
    };

    console.log('📤 Sending complete GIN data:', JSON.stringify(apiData, null, 2));

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create complete GIN');
    }
    
    const result = await response.json();
    console.log('✅ Complete GIN create response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        gin: {
          ginId: result.data.gin.ginId,
          ginNumber: result.data.gin.ginNumber,
          stockKeeperId: result.data.gin.stockKeeperId,
          issuedTo: result.data.gin.issuedTo,
          issueReason: result.data.gin.issueReason,
          issueDate: result.data.gin.issueDate,
          remarks: result.data.gin.remarks,
          stockId: result.data.gin.stockId
        },
        ginDetails: result.data.ginDetails,
        totalDetailsCreated: result.data.totalDetailsCreated
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('❌ Error creating complete GIN:', error);
    throw error;
  }
}

// Update GIN - Updated to use query parameter
export async function updateGin(id: number, data: UpdateGINRequest): Promise<GIN> {
  try {
    console.log('🔗 Updating GIN:', id, data);
    
    const apiData = {
      ...(data.ginNumber !== undefined && { ginNumber: data.ginNumber }),
      ...(data.issuedTo !== undefined && { issuedTo: data.issuedTo }),
      ...(data.issueReason !== undefined && { issueReason: data.issueReason }),
      ...(data.issueDate !== undefined && { issueDate: data.issueDate }),
      ...(data.remarks !== undefined && { remarks: data.remarks }),
      ...(data.stockId !== undefined && { stockId: data.stockId })
    };

    console.log('📤 Sending update data:', apiData);

    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Update error response:', errorData);
      throw new Error(errorData.message || 'Failed to update GIN');
    }
    
    const result = await response.json();
    console.log('✅ Update response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        ginId: result.data.ginId,
        ginNumber: result.data.ginNumber,
        stockKeeperId: result.data.stockKeeperId,
        issuedTo: result.data.issuedTo,
        issueReason: result.data.issueReason,
        issueDate: result.data.issueDate,
        remarks: result.data.remarks,
        stockId: result.data.stockId
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('❌ Error updating GIN:', error);
    throw error;
  }
}

// Delete GIN - Updated to use query parameter
export async function deleteGin(id: number): Promise<void> {
  try {
    console.log('🔗 Deleting GIN:', id);
    
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Delete error response:', errorData);
      throw new Error(errorData.message || 'Failed to delete GIN');
    }
    
    const result = await response.json();
    console.log('✅ Delete response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete GIN');
    }
  } catch (error) {
    console.error('❌ Error deleting GIN:', error);
    throw error;
  }
}

// Search GINs with enhanced functionality
export async function searchGins(searchTerm: string, filters?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  issuedTo?: string;
  stockKeeperId?: number;
  issueReason?: string;
}): Promise<{
  items: GIN[]
  pagination: any
  sorting: any
  search: string | null
  filters: any
}> {
  try {
    console.log('🔍 Searching GINs with term:', searchTerm, 'and filters:', filters);
    
    const params = {
      search: searchTerm,
      ...filters
    };
    
    return await fetchGinsWithParams(params);
  } catch (error) {
    console.error('❌ Error searching GINs:', error);
    throw error;
  }
}

// Get GIN statistics
export async function getGinStatistics(): Promise<{
  totalGins: number;
  recentGins: GIN[];
}> {
  try {
    console.log('📊 Fetching GIN statistics...');
    
    // Fetch recent GINs (last 10)
    const recentResponse = await fetchGinsWithParams({
      page: 1,
      limit: 10,
      sortBy: 'issueDate',
      sortOrder: 'desc'
    });
    
    return {
      totalGins: recentResponse.pagination.totalItems,
      recentGins: recentResponse.items
    };
  } catch (error) {
    console.error('❌ Error fetching GIN statistics:', error);
    throw error;
  }
}