import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '@/types/supplier';

// Base URL for supplier API
const BASE_URL = '/api/supplier';

// Fetch all suppliers
export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch suppliers');
    }
    
    const result = await response.json();
    console.log('API Response:', result); // Debug log
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data && result.data.items) {
      // Transform API response to match Supplier type (PascalCase)
      return result.data.items.map((item: any) => ({
        SupplierID: item.supplierID,
        SupplierName: item.supplierName,
        ContactPerson: item.contactPerson,
        Email: item.email,
        Phone: item.phone,
        Address: item.address || '',
        City: item.city || '',
        Country: item.country || '',
        IsActive: item.isActive,
        CreatedAt: item.createdDate,
        CreatedBy: 1, // Default value
        UpdatedAt: item.updatedDate || item.createdDate,
        UpdatedBy: 1, // Default value
        DeletedAt: null,
        DeletedBy: null
      }));
    } else {
      console.error('Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
}

// Create supplier
export async function createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
  try {
    console.log('Creating supplier with data:', data); // Debug log
    
    // Transform PascalCase to camelCase for API
    const apiData = {
      supplierName: data.SupplierName,
      contactPerson: data.ContactPerson,
      email: data.Email,
      phone: data.Phone,
      address: data.Address || '',
      city: data.City || '',
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
      throw new Error(errorData.message || 'Failed to create supplier');
    }
    
    const result = await response.json();
    console.log('Create response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform camelCase response back to PascalCase Supplier type
      return {
        SupplierID: result.data.supplierID,
        SupplierName: result.data.supplierName,
        ContactPerson: result.data.contactPerson,
        Email: result.data.email,
        Phone: result.data.phone,
        Address: result.data.address || '',
        City: result.data.city || '',
        Country: result.data.country || '',
        IsActive: result.data.isActive,
        CreatedAt: result.data.createdDate,
        CreatedBy: 1,
        UpdatedAt: result.data.updatedDate || result.data.createdDate,
        UpdatedBy: 1,
        DeletedAt: null,
        DeletedBy: null
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
}

// Update supplier
export async function updateSupplier(id: number, data: UpdateSupplierRequest): Promise<Supplier> {
  try {
    console.log('Updating supplier:', id, data); // Debug log
    
    // Transform PascalCase to camelCase for API
    const apiData = {
      supplierId: id,
      ...(data.SupplierName !== undefined && { supplierName: data.SupplierName }),
      ...(data.ContactPerson !== undefined && { contactPerson: data.ContactPerson }),
      ...(data.Email !== undefined && { email: data.Email }),
      ...(data.Phone !== undefined && { phone: data.Phone }),
      ...(data.Address !== undefined && { address: data.Address }),
      ...(data.City !== undefined && { city: data.City }),
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
      throw new Error(errorData.message || 'Failed to update supplier');
    }
    
    const result = await response.json();
    console.log('Update response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform camelCase response back to PascalCase Supplier type
      return {
        SupplierID: result.data.supplierID,
        SupplierName: result.data.supplierName,
        ContactPerson: result.data.contactPerson,
        Email: result.data.email,
        Phone: result.data.phone,
        Address: result.data.address || '',
        City: result.data.city || '',
        Country: result.data.country || '',
        IsActive: result.data.isActive,
        CreatedAt: result.data.createdDate,
        CreatedBy: 1,
        UpdatedAt: result.data.updatedDate,
        UpdatedBy: 1,
        DeletedAt: null,
        DeletedBy: null
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
}

// Delete supplier
export async function deleteSupplier(id: number): Promise<void> {
  try {
    console.log('Deleting supplier:', id); // Debug log
    
    // Use supplierId parameter name to match the API route
    const response = await fetch(`${BASE_URL}?supplierId=${id}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Delete error response:', errorData); // Debug log
      throw new Error(errorData.message || 'Failed to delete supplier');
    }
    
    const result = await response.json();
    console.log('Delete response:', result); // Debug log
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete supplier');
    }
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
}