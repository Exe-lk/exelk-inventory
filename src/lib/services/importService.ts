import { ImportFile, CreateImportRequest, UpdateImportRequest, ImportFileDetail } from '@/types/importfile';

// Base URL for import API
const BASE_URL = '/api/import';

// Fetch all import files with optional query parameters
export async function fetchImportFiles(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  fileType?: string;
  status?: string;
}): Promise<{
  items: ImportFile[];
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
  search: string | null;
  filters: {
    fileType: string | null;
    status: string | null;
  };
}> {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.fileType) queryParams.append('fileType', params.fileType);
    if (params?.status) queryParams.append('status', params.status);

    const url = queryParams.toString() ? `${BASE_URL}?${queryParams}` : BASE_URL;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch import files');
    }
    
    const result = await response.json();
    console.log('API Response:', result); // Debug log
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data) {
      // Transform API response to match ImportFile type (PascalCase)
      const transformedItems = result.data.items?.map((item: any) => ({
        ImportID: item.ImportID,
        StockKeeperID: item.StockKeeperID,
        FileName: item.FileName,
        FileType: item.FileType,
        ImportDate: item.ImportDate,
        Status: item.Status,
        ErrorCount: item.ErrorCount,
        Remarks: item.Remarks,
        FilePath: item.FilePath
      })) || [];

      return {
        items: transformedItems,
        pagination: result.data.pagination,
        sorting: result.data.sorting,
        search: result.data.search,
        filters: result.data.filters
      };
    } else {
      console.error('Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching import files:', error);
    throw error;
  }
}

// Fetch all import files (simplified version without pagination)
export async function fetchAllImportFiles(): Promise<ImportFile[]> {
  try {
    const result = await fetchImportFiles({ limit: 1000 }); // Get a large number to simulate "all"
    return result.items;
  } catch (error) {
    console.error('Error fetching all import files:', error);
    throw error;
  }
}

// Fetch single import file by ID
export async function fetchImportFileById(id: number): Promise<ImportFileDetail> {
  try {
    console.log('Fetching import file with ID:', id); // Debug log
    
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch import file');
    }
    
    const result = await response.json();
    console.log('Single import file API Response:', result); // Debug log
    
    // Handle the response structure
    if (result.success && result.data) {
      return {
        importId: result.data.importId,
        fileName: result.data.fileName,
        fileType: result.data.fileType,
        uploadedBy: result.data.uploadedBy,
        uploadedDate: result.data.uploadedDate,
        status: result.data.status,
        totalRecords: result.data.totalRecords,
        processedRecords: result.data.processedRecords,
        failedRecords: result.data.failedRecords,
        remarks: result.data.remarks
      };
    } else {
      console.error('Invalid response format:', result);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching import file:', error);
    throw error;
  }
}

// Create import file
export async function createImportFile(data: CreateImportRequest): Promise<ImportFile> {
  try {
    console.log('Creating import file with data:', data); // Debug log
    
    // Transform PascalCase to camelCase for API
    const apiData = {
      fileName: data.FileName,
      fileType: data.FileType,
      filePath: data.FilePath,
      StockKeeperID: data.StockKeeperID,
      status: data.Status || 'processing',
      errorCount: data.ErrorCount || 0,
      remarks: data.Remarks || null
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create import file');
    }
    
    const result = await response.json();
    console.log('Create response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform camelCase response back to PascalCase ImportFile type
      return {
        ImportID: result.data.ImportID,
        StockKeeperID: result.data.StockKeeperID,
        FileName: result.data.FileName,
        FileType: result.data.FileType,
        ImportDate: result.data.ImportDate,
        Status: result.data.Status,
        ErrorCount: result.data.ErrorCount,
        Remarks: result.data.Remarks,
        FilePath: result.data.FilePath
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error creating import file:', error);
    throw error;
  }
}

// Update import file
export async function updateImportFile(id: number, data: UpdateImportRequest): Promise<ImportFile> {
  try {
    console.log('Updating import file:', id, data); // Debug log
    
    // Transform PascalCase to camelCase for API
    const apiData = {
      importId: id,
      ...(data.FileName !== undefined && { fileName: data.FileName }),
      ...(data.FileType !== undefined && { fileType: data.FileType }),
      ...(data.Status !== undefined && { status: data.Status }),
      ...(data.ErrorCount !== undefined && { errorCount: data.ErrorCount }),
      ...(data.Remarks !== undefined && { remarks: data.Remarks }),
      ...(data.FilePath !== undefined && { filePath: data.FilePath })
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
      throw new Error(errorData.message || 'Failed to update import file');
    }
    
    const result = await response.json();
    console.log('Update response:', result); // Debug log
    
    if (result.status === 'success' && result.data) {
      // Transform camelCase response back to PascalCase ImportFile type
      return {
        ImportID: result.data.ImportID,
        StockKeeperID: result.data.StockKeeperID,
        FileName: result.data.FileName,
        FileType: result.data.FileType,
        ImportDate: result.data.ImportDate,
        Status: result.data.Status,
        ErrorCount: result.data.ErrorCount,
        Remarks: result.data.Remarks,
        FilePath: result.data.FilePath
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error updating import file:', error);
    throw error;
  }
}

// Delete import file
export async function deleteImportFile(id: number): Promise<void> {
  try {
    console.log('Deleting import file:', id); // Debug log
    
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for auth
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Delete error response:', errorData); // Debug log
      throw new Error(errorData.message || 'Failed to delete import file');
    }
    
    const result = await response.json();
    console.log('Delete response:', result); // Debug log
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete import file');
    }
  } catch (error) {
    console.error('Error deleting import file:', error);
    throw error;
  }
}



// Update import file status
export async function updateImportFileStatus(id: number, status: string, errorCount?: number, remarks?: string): Promise<ImportFile> {
  try {
    const updateData: UpdateImportRequest = {
      Status: status,
      ...(errorCount !== undefined && { ErrorCount: errorCount }),
      ...(remarks !== undefined && { Remarks: remarks })
    };
    
    return await updateImportFile(id, updateData);
  } catch (error) {
    console.error('Error updating import file status:', error);
    throw error;
  }
}

// Get import files by status
export async function fetchImportFilesByStatus(status: string): Promise<ImportFile[]> {
  try {
    const result = await fetchImportFiles({ status, limit: 1000 });
    return result.items;
  } catch (error) {
    console.error('Error fetching import files by status:', error);
    throw error;
  }
}

// Get import files by file type
export async function fetchImportFilesByType(fileType: string): Promise<ImportFile[]> {
  try {
    const result = await fetchImportFiles({ fileType, limit: 1000 });
    return result.items;
  } catch (error) {
    console.error('Error fetching import files by type:', error);
    throw error;
  }
}

// Search import files
export async function searchImportFiles(searchTerm: string): Promise<ImportFile[]> {
  try {
    const result = await fetchImportFiles({ search: searchTerm, limit: 1000 });
    return result.items;
  } catch (error) {
    console.error('Error searching import files:', error);
    throw error;
  }
}

// Add this new function for actual file upload with FormData
export async function uploadAndCreateImportFile(file: File, remarks?: string, stockKeeperID?: number): Promise<ImportFile> {
  try {
    console.log('Uploading and creating import file:', file.name, file.type);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('remarks', remarks || '');
    if (stockKeeperID) {
      formData.append('StockKeeperID', stockKeeperID.toString());
    }

    const response = await fetch(BASE_URL, {
      method: 'POST',
      credentials: 'include',
      body: formData, // Send FormData instead of JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload and create import file');
    }

    const result = await response.json();
    console.log('Upload and create response:', result);

    if (result.status === 'success' && result.data) {
      return {
        ImportID: result.data.ImportID,
        StockKeeperID: result.data.StockKeeperID,
        FileName: result.data.FileName,
        FileType: result.data.FileType,
        ImportDate: result.data.ImportDate,
        Status: result.data.Status,
        ErrorCount: result.data.ErrorCount,
        Remarks: result.data.Remarks,
        FilePath: result.data.FilePath
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error uploading and creating import file:', error);
    throw error;
  }
}

// Update the existing uploadImportFile function (keep for backward compatibility)
export async function uploadImportFile(file: File, stockKeeperID?: number): Promise<ImportFile> {
  return uploadAndCreateImportFile(file, undefined, stockKeeperID);
}