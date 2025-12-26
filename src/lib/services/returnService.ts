
import { ReturnResponse, CreateReturnRequest, UpdateReturnRequest, ReturnsListResponse, GetReturnsQueryParams, ReturnStatus, ReturnType } from '@/types/return';

// Base URL for Return API
const BASE_URL = '/api/return';

// Interface for supplier
export interface Supplier {
  supplierId: number;
  supplierName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

// Interface for product
export interface Product {
  productId: number;
  productName: string;
  sku?: string;
  description?: string;
  brandName?: string;
  categoryName?: string;
  versions?: ProductVersion[];
}

// Interface for product version
export interface ProductVersion {
  versionId: number;
  versionName: string;
  variations?: ProductVariation[];
}

// Interface for product variation
export interface ProductVariation {
  variationId: number;
  variationName: string;
  color?: string;
  size?: string;
  capacity?: string;
  price?: number;
  versionId?: number;
  isActive?: boolean;
}

// Interface for return filters
export interface ReturnFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  supplierId?: number;
  returnType?: string;
  returnStatus?: string;
  employeeId?: number;
  dateFrom?: string;
  dateTo?: string;
}

// Response interfaces
export interface ReturnCreateResponse {
  returnId: number;
  returnNumber: string;
  returnedBy: number;
  returnDate: string | null;
  reason: string | null;
  status: string | null;
  remarks: string | null;
  returnType: string | null;
  approved: boolean | null;
  details: any[];
}

export interface ReturnUpdateResponse extends ReturnCreateResponse {
  updatedAt: string;
}

// Fetch all suppliers for form dropdowns
export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    console.log(' Fetching suppliers for return form');
    
    const response = await fetch('/api/supplier', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch suppliers error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch suppliers');
    }
    
    const result = await response.json();
    console.log(' Suppliers API Response:', result);
    
    if (result.status === 'success' && result.data && result.data.items) {
      return result.data.items.map((supplier: any) => ({
        supplierId: supplier.supplierId || supplier.SupplierID || supplier.supplierID,
        supplierName: supplier.supplierName || supplier.SupplierName,
        contactPerson: supplier.contactPerson || supplier.ContactPerson,
        email: supplier.email || supplier.Email,
        phone: supplier.phone || supplier.Phone,
        isActive: supplier.isActive !== false
      }));
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching suppliers:', error);
    throw error;
  }
}

// Fetch all products for form dropdowns
export async function fetchProducts(): Promise<Product[]> {
  try {
    console.log(' Fetching products for return form');
    
    const response = await fetch('/api/product', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch products error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch products');
    }
    
    const result = await response.json();
    console.log(' Products API Response:', result);
    
    if (result.status === 'success' && result.data && result.data.items) {
      return result.data.items.map((product: any) => ({
        productId: product.productId,
        productName: product.productName,
        sku: product.sku,
        description: product.description,
        brandName: product.brandName,
        categoryName: product.categoryName,
        versions: product.versions || []
      }));
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching products:', error);
    throw error;
  }
}


// Fetch product variations for form dropdowns
export async function fetchProductVariations(): Promise<ProductVariation[]> {
  try {
    console.log(' Fetching product variations for return form');
    
    const response = await fetch('/api/productvariation', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch product variations error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch product variations');
    }
    
    const result = await response.json();
    console.log(' Product Variations API Response:', result);
    
    if (result.status === 'success' && result.data && result.data.items) {
      return result.data.items.map((variation: any) => ({
        variationId: variation.variationId,
        variationName: variation.variationName,
        color: variation.color,
        size: variation.size,
        capacity: variation.capacity,
        price: variation.price,
        versionId: variation.versionId,
        isActive: variation.isActive !== false
      }));
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching product variations:', error);
    throw error;
  }
}


// Add this function to your returnService.ts

// Fetch return details by ID for viewing
export async function fetchReturnDetailsById(returnId: number): Promise<any> {
  try {
    console.log(` Fetching return details for ID: ${returnId}`);

    //${BASE_URL}?id=${returnId}
    
    const response = await fetch(`/api/return/returnId?id=${returnId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch return details error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch return details');
    }
    
    const result = await response.json();
    console.log(' Return details API Response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        return: result.data,
        details: result.data.details || []
      };
      //return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching return details:', error);
    throw error;
  }
}

// Fetch variations by product ID
export async function fetchVariationsByProductId(productId: number): Promise<ProductVariation[]> {
  try {
    console.log(` Fetching variations for product ID: ${productId}`);
    
    const response = await fetch(`/api/productvariation?productId=${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'success' && data.data && data.data.items) {
      console.log(` Found ${data.data.items.length} variations for product ${productId}`);
      return data.data.items.filter((variation: any) => 
        variation.versionId && variation.isActive !== false
      ).map((variation: any) => ({
        variationId: variation.variationId,
        variationName: variation.variationName,
        color: variation.color,
        size: variation.size,
        capacity: variation.capacity,
        price: variation.price,
        versionId: variation.versionId,
        isActive: variation.isActive !== false
      }));
    } else {
      console.log(` No variations found for product ${productId}`);
      return [];
    }
  } catch (error) {
    console.error(` Error fetching variations for product ${productId}:`, error);
    return [];
  }
}

// Fetch variations by version ID
export async function fetchVariationsByVersionId(versionId: number): Promise<ProductVariation[]> {
  try {
    console.log(` Fetching variations for version: ${versionId}`);
    
    const response = await fetch(`/api/productvariation?versionId=${versionId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch variations error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch variations');
    }
    
    const result = await response.json();
    console.log(' Variations API Response:', result);
    
    if (result.status === 'success' && result.data && result.data.items) {
      return result.data.items.map((variation: any) => ({
        variationId: variation.variationId,
        variationName: variation.variationName,
        color: variation.color,
        size: variation.size,
        capacity: variation.capacity,
        price: variation.price,
        versionId: variation.versionId,
        isActive: variation.isActive !== false
      }));
    } else {
      return []; // Return empty array if no variations found
    }
  } catch (error) {
    console.error(' Error fetching variations:', error);
    return []; // Return empty array on error
  }
}

// Fetch all returns with filtering and pagination
export async function fetchReturns(filters: ReturnFilter = {}): Promise<ReturnsListResponse> {
  try {
    console.log(' Fetching returns with filters:', filters);
    
    const queryParams = new URLSearchParams();
    
    if (filters.page) queryParams.set('page', filters.page.toString());
    if (filters.limit) queryParams.set('limit', filters.limit.toString());
    if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.supplierId) queryParams.set('supplierId', filters.supplierId.toString());
    if (filters.returnType) queryParams.set('returnType', filters.returnType);
    if (filters.returnStatus) queryParams.set('returnStatus', filters.returnStatus);
    if (filters.employeeId) queryParams.set('employeeId', filters.employeeId.toString());
    if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.set('dateTo', filters.dateTo);

    const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;
    console.log(' Request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch returns error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch returns');
    }
    
    const result = await response.json();
    console.log(' Returns API Response:', result);
    
    if (result.status === 'success' && result.data) {
      // Transform the response data to match our ReturnResponse interface
      const transformedItems: ReturnResponse[] = result.data.items.map((item: any) => ({
        returnId: item.returnId,
        returnNumber: item.returnNumber,
        returnedBy: item.returnedBy,
        returnDate: item.returnDate,
        reason: item.reason,
        status: item.status,
        remarks: item.remarks,
        returnType: item.returnType,
        approved: item.approved,
        supplier: item.supplier,
        employee: item.employee,
        details: item.details || []
      }));

      return {
        items: transformedItems,
        pagination: result.data.pagination,
        sorting: result.data.sorting,
        search: result.data.search,
        filters: result.data.filters
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching returns:', error);
    throw error;
  }
}

// Fetch single return by ID
export async function fetchReturnById(id: number): Promise<ReturnResponse> {
  try {
    console.log(' Fetching return with ID:', id);
    
    const response = await fetch(`/api/return/returnId?id=${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch return');
    }
    
    const result = await response.json();
    console.log(' Return fetch response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        returnId: result.data.returnId,
        returnNumber: result.data.returnNumber,
        returnedBy: result.data.returnedBy,
        returnDate: result.data.returnDate,
        reason: result.data.reason,
        status: result.data.status,
        remarks: result.data.remarks,
        returnType: result.data.returnType,
        approved: result.data.approved,
        supplier: result.data.supplier,
        employee: result.data.employee,
        details: result.data.details || []
      };
    } else {
      throw new Error('Return not found');
    }
  } catch (error) {
    console.error(' Error fetching return:', error);
    throw error;
  }
}

// Create new return
export async function createReturn(data: CreateReturnRequest): Promise<ReturnCreateResponse> {
  try {
    console.log(' Creating return with data:', data);

    // Client-side validation
    if (!data.supplierId || data.supplierId <= 0) {
      throw new Error('Invalid supplier ID');
    }
    
    if (!data.returnDate) {
      throw new Error('Return date is required');
    }
    
    if (!data.reason) {
      throw new Error('Return reason is required');
    }
    
    if (!data.details || data.details.length === 0) {
      throw new Error('At least one return item is required');
    }

    // Validate each detail item
    for (const detail of data.details) {
      if (!detail.variationId || detail.variationId <= 0) {
        throw new Error('Valid variation ID is required for each item');
      }
      if (!detail.quantity || detail.quantity <= 0) {
        throw new Error('Valid quantity is required for each item');
      }
    }
    
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Return creation error response:', errorData);
      throw new Error(errorData.message || 'Failed to create return');
    }
    
    const result = await response.json();
    console.log(' Return creation response:', result);
    
    if (result.status === 'success' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error creating return:', error);
    throw error;
  }
}

// Update return
export async function updateReturn(id: number, data: UpdateReturnRequest): Promise<ReturnUpdateResponse> {
  try {
    console.log(' Updating return:', id, data);
    
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Update error response:', errorData);
      throw new Error(errorData.message || 'Failed to update return');
    }
    
    const result = await response.json();
    console.log(' Update response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        ...result.data,
        updatedAt: new Date().toISOString()
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error updating return:', error);
    throw error;
  }
}

// Delete return
export async function deleteReturn(id: number): Promise<void> {
  try {
    console.log(' Deleting return:', id);
    
    const response = await fetch(`${BASE_URL}?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Delete error response:', errorData);
      throw new Error(errorData.message || 'Failed to delete return');
    }
    
    const result = await response.json();
    console.log(' Delete response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete return');
    }
  } catch (error) {
    console.error(' Error deleting return:', error);
    throw error;
  }
}


export async function fetchReturnsByStatus(status: string, filters: Omit<ReturnFilter, 'returnStatus'> = {}): Promise<ReturnsListResponse> {
  try {
    console.log(' Fetching returns by status:', status);
    
    return await fetchReturns({
      ...filters,
      returnStatus: status
    });
  } catch (error) {
    console.error(' Error fetching returns by status:', error);
    throw error;
  }
}

// Get returns by type
export async function fetchReturnsByType(type: string, filters: Omit<ReturnFilter, 'returnType'> = {}): Promise<ReturnsListResponse> {
  try {
    console.log(' Fetching returns by type:', type);
    
    return await fetchReturns({
      ...filters,
      returnType: type
    });
  } catch (error) {
    console.error(' Error fetching returns by type:', error);
    throw error;
  }
}

// Get pending returns
export async function fetchPendingReturns(filters: Omit<ReturnFilter, 'returnStatus'> = {}): Promise<ReturnsListResponse> {
  try {
    console.log(' Fetching pending returns');
    
    return await fetchReturnsByStatus(ReturnStatus.PENDING, filters);
  } catch (error) {
    console.error(' Error fetching pending returns:', error);
    throw error;
  }
}

// Approve return
export async function approveReturn(id: number): Promise<ReturnUpdateResponse> {
  try {
    console.log(' Approving return:', id);
    
    const updateData: UpdateReturnRequest = {
      approved: true,
      returnStatus: ReturnStatus.APPROVED
    };
    
    return await updateReturn(id, updateData);
  } catch (error) {
    console.error(' Error approving return:', error);
    throw error;
  }
}

// Reject return
export async function rejectReturn(id: number, reason?: string): Promise<ReturnUpdateResponse> {
  try {
    console.log(' Rejecting return:', id, 'with reason:', reason);
    
    const updateData: UpdateReturnRequest = {
      approved: false,
      returnStatus: ReturnStatus.REJECTED,
      remarks: reason
    };
    
    return await updateReturn(id, updateData);
  } catch (error) {
    console.error(' Error rejecting return:', error);
    throw error;
  }
}

// Complete return
export async function completeReturn(id: number): Promise<ReturnUpdateResponse> {
  try {
    console.log(' Completing return:', id);
    
    const updateData: UpdateReturnRequest = {
      returnStatus: ReturnStatus.COMPLETED
    };
    
    return await updateReturn(id, updateData);
  } catch (error) {
    console.error(' Error completing return:', error);
    throw error;
  }
}

// Cancel return
export async function cancelReturn(id: number): Promise<ReturnUpdateResponse> {
  try {
    console.log(' Cancelling return:', id);
    
    const updateData: UpdateReturnRequest = {
      returnStatus: ReturnStatus.CANCELLED
    };
    
    return await updateReturn(id, updateData);
  } catch (error) {
    console.error(' Error cancelling return:', error);
    throw error;
  }
}

// Get return summary statistics
export async function getReturnSummary(): Promise<{
  totalReturns: number;
  pendingReturns: number;
  approvedReturns: number;
  rejectedReturns: number;
  completedReturns: number;
}> {
  try {
    console.log(' Fetching return summary');
    
    // Fetch all returns to calculate summary
    const allReturns = await fetchReturns({ limit: 1000 }); // Get all items
    
    const totalReturns = allReturns.items.length;
    const pendingReturns = allReturns.items.filter(returnItem => 
      returnItem.status === ReturnStatus.PENDING
    ).length;
    const approvedReturns = allReturns.items.filter(returnItem => 
      returnItem.status === ReturnStatus.APPROVED
    ).length;
    const rejectedReturns = allReturns.items.filter(returnItem => 
      returnItem.status === ReturnStatus.REJECTED
    ).length;
    const completedReturns = allReturns.items.filter(returnItem => 
      returnItem.status === ReturnStatus.COMPLETED
    ).length;
    
    return {
      totalReturns,
      pendingReturns,
      approvedReturns,
      rejectedReturns,
      completedReturns
    };
  } catch (error) {
    console.error(' Error fetching return summary:', error);
    throw error;
  }
}

// Search returns
export async function searchReturns(query: string, filters: Omit<ReturnFilter, 'search'> = {}): Promise<ReturnsListResponse> {
  try {
    console.log(' Searching returns with query:', query);
    
    return await fetchReturns({
      ...filters,
      search: query
    });
  } catch (error) {
    console.error(' Error searching returns:', error);
    throw error;
  }
}

// Get returns by date range
export async function fetchReturnsByDateRange(
  dateFrom: string, 
  dateTo: string, 
  filters: Omit<ReturnFilter, 'dateFrom' | 'dateTo'> = {}
): Promise<ReturnsListResponse> {
  try {
    console.log(' Fetching returns by date range:', dateFrom, 'to', dateTo);
    
    return await fetchReturns({
      ...filters,
      dateFrom,
      dateTo
    });
  } catch (error) {
    console.error(' Error fetching returns by date range:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function fetchVariationsByProduct(productId: number): Promise<ProductVariation[]> {
  return fetchVariationsByProductId(productId);
}

