
import { Stock, StockFilter, StockInRequest, StockOutRequest, UpdateStockRequest } from '@/types/stock';

// Base URL for Stock API
const BASE_URL = '/api/stock';

export interface Supplier {
  SupplierID: number;
  SupplierName: string;
  IsActive: boolean;
}

interface ProductVariation {
  variationId: number;
  variationName: string;
  color: string;
  size: string;
  capacity: string;
  price: number;
  versionId?: number;
  isActive?: boolean;
}

// Response interfaces
export interface StockResponse {
  items: Stock[]
  pagination: {
    totalItems: number
    page: number
    limit: number
    totalPages: number
  }
  sorting: {
    sortBy: string
    sortOrder: string
  }
  search: string | null
  filters: any
}

export interface StockInResponse {
  grnId: number
  grnNumber: string
  totalAmount: number
  createdDate: string
  details: any[]
  stockUpdates: any[]
  binCardEntries: any[]
  transactionLogCount: number
}

export interface StockOutResponse {
  ginId: number
  ginNumber: string
  createdAt: string
  details: any[]
  stockUpdates: any[]
  binCardEntries: any[]
  transactionLogCount: number
}

// Fetch all products for form dropdowns
export async function fetchProducts(): Promise<any[]> {
  try {
    console.log(' Fetching products for form');
    
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
      return result.data.items;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching products:', error);
    throw error;
  }
}

// Fetch all suppliers for form dropdowns
// export async function fetchSuppliers(): Promise<any[]> {
//   try {
//     console.log(' Fetching suppliers for form');
    
//     const response = await fetch('/api/supplier', {
//       method: 'GET',
//       credentials: 'include',
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error(' Fetch suppliers error response:', errorData);
//       throw new Error(errorData.message || 'Failed to fetch suppliers');
//     }
    
//     const result = await response.json();
//     console.log(' Suppliers API Response:', result);
    
//     if (result.status === 'success' && result.data && result.data.items) {
//       return result.data.items;
//     } else {
//       throw new Error(result.message || 'Invalid response format');
//     }
//   } catch (error) {
//     console.error(' Error fetching suppliers:', error);
//     throw error;
//   }
// }

export async function fetchSuppliers(): Promise<any[]> {
  try {
    console.log(' Fetching suppliers for form');
    
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
      // Add debugging to see the actual data structure
      console.log(' First supplier in response:', result.data.items[0]);
      
      return result.data.items.map((supplier: any) => {
        // Debug the mapping process
        console.log(' Mapping supplier:', supplier);
        
        // Handle different possible field names
        const mappedSupplier = {
          supplierId:  supplier.supplierID || supplier.SupplierID || supplier.supplierId,
          supplierName: supplier.supplierName || supplier.SupplierName || supplier.supplierName
        };
        
        console.log(' Mapped to:', mappedSupplier);
        return mappedSupplier;
      });

      // return result.data.items.map((supplier: any) => {
      //   // Debug the mapping process
        

      //   supplierID:  supplier.SupplierID,
      //   supplierName: supplier.supplierName 
        
      //   // Handle different possible field names
        
        
       
        
      // });

      


    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching suppliers:', error);
    throw error;
  }
}


// Fetch variations by version ID (NEW FUNCTION)
export async function fetchVariationsByVersionId(versionId: number): Promise<any[]> {
  try {
    console.log(' Fetching variations for version:', versionId);
    
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
      return result.data.items;
    } else {
      return []; // Return empty array if no variations found
    }
  } catch (error) {
    console.error(' Error fetching variations:', error);
    return []; // Return empty array on error
  }
}

// Updated function to fetch variations by product ID
// export async function fetchVariationsByProductId(productId: number): Promise<any[]> {
//   try {
//     console.log(' Fetching variations for product:', productId);
    
//     // First, get the product to find its versions
//     const productResponse = await fetch(`/api/product?productId=${productId}`, {
//       method: 'GET',
//       credentials: 'include',
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
    
//     if (!productResponse.ok) {
//       throw new Error('Failed to fetch product details');
//     }
    
//     const productResult = await productResponse.json();
//     if (productResult.status !== 'success' || !productResult.data) {
//       return [];
//     }
    
//     // Get all variations for all versions of this product
//     const allVariations: any[] = [];
    
//     if (productResult.data.items && productResult.data.items.length > 0) {
//       const product = productResult.data.items.find((p: any) => p.productId === productId);
//       if (product && product.versions) {
//         for (const version of product.versions) {
//           const versionVariations = await fetchVariationsByVersionId(version.versionId);
//           allVariations.push(...versionVariations);
//         }
//       }
//     }
    
//     return allVariations;
//   } catch (error) {
//     console.error(' Error fetching variations by product ID:', error);
//     return [];
//   }
// }

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
        variation.versionId && variation.isActive
      );
    } else {
      console.log(` No variations found for product ${productId}`);
      return [];
    }
  } catch (error) {
    console.error(` Error fetching variations for product ${productId}:`, error);
    return [];
  }
}

// Legacy function for backward compatibility (UPDATED)
export async function fetchVariationsByProduct(productId: number): Promise<any[]> {
  return fetchVariationsByProductId(productId);
}

// Fetch all stocks with filtering and pagination
export async function fetchStocks(filters: StockFilter = {}): Promise<StockResponse> {
  try {
    console.log(' Fetching stocks with filters:', filters);
    
    const queryParams = new URLSearchParams();
    
    if (filters.page) queryParams.set('page', filters.page.toString());
    if (filters.limit) queryParams.set('limit', filters.limit.toString());
    if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.productId) queryParams.set('productId', filters.productId.toString());
    if (filters.variationId) queryParams.set('variationId', filters.variationId.toString());
    if (filters.lowStock !== undefined) queryParams.set('lowStock', filters.lowStock.toString());

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
      console.error(' Fetch stocks error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch stocks');
    }
    
    const result = await response.json();
    console.log(' Stocks API Response:', result);
    
    if (result.status === 'success' && result.data) {
      // Transform the response data to match our Stock interface
      const transformedItems: Stock[] = result.data.items.map((item: any) => ({
        stockId: item.stockId,
        productId: item.productId,
        variationId: item.variationId,
        quantityAvailable: item.quantityAvailable,
        reorderLevel: item.reorderLevel,
        lastUpdatedDate: item.lastUpdatedDate,
        location: item.location,
        // Additional fields for display
        productName: item.productName,
        productSku: item.productSku,
        brandName: item.brandName,
        categoryName: item.categoryName,
        variationName: item.variationName,
        variationColor: item.variationColor,
        variationSize: item.variationSize,
        variationCapacity: item.variationCapacity
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
    console.error(' Error fetching stocks:', error);
    throw error;
  }
}

// Fetch single stock by ID
export async function fetchStockById(id: number): Promise<Stock> {
  try {
    console.log(' Fetching stock with ID:', id);
    
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch stock');
    }
    
    const result = await response.json();
    console.log(' Stock fetch response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        stockId: result.data.stockId,
        productId: result.data.productId,
        variationId: result.data.variationId,
        quantityAvailable: result.data.quantityAvailable,
        reorderLevel: result.data.reorderLevel,
        lastUpdatedDate: result.data.lastUpdatedDate,
        location: result.data.location,
        // Additional display fields
        productName: result.data.productName,
        productSku: result.data.productSku,
        brandName: result.data.brandName,
        categoryName: result.data.categoryName,
        variationName: result.data.variationName,
        variationColor: result.data.variationColor,
        variationSize: result.data.variationSize,
        variationCapacity: result.data.variationCapacity
      };
    } else {
      throw new Error('Stock not found');
    }
  } catch (error) {
    console.error(' Error fetching stock:', error);
    throw error;
  }
}

// Update stock
export async function updateStock(id: number, data: UpdateStockRequest): Promise<Stock> {
  try {
    console.log(' Updating stock:', id, data);
    
    const response = await fetch(`${BASE_URL}/${id}`, {
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
      throw new Error(errorData.message || 'Failed to update stock');
    }
    
    const result = await response.json();
    console.log(' Update response:', result);
    
    if (result.status === 'success' && result.data) {
      return {
        stockId: result.data.stockId,
        productId: result.data.productId,
        variationId: result.data.variationId,
        quantityAvailable: result.data.quantityAvailable,
        reorderLevel: result.data.reorderLevel,
        lastUpdatedDate: result.data.lastUpdatedDate,
        location: result.data.location,
        // Additional display fields
        productName: result.data.productName,
        productSku: result.data.productSku,
        brandName: result.data.brandName,
        categoryName: result.data.categoryName,
        variationName: result.data.variationName,
        variationColor: result.data.variationColor,
        variationSize: result.data.variationSize,
        variationCapacity: result.data.variationCapacity
      };
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error updating stock:', error);
    throw error;
  }
}

// Delete stock
export async function deleteStock(id: number): Promise<void> {
  try {
    console.log(' Deleting stock:', id);
    
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Delete error response:', errorData);
      throw new Error(errorData.message || 'Failed to delete stock');
    }
    
    const result = await response.json();
    console.log(' Delete response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete stock');
    }
  } catch (error) {
    console.error(' Error deleting stock:', error);
    throw error;
  }
}

// Stock-In operation
export async function createStockIn(data: StockInRequest): Promise<StockInResponse> {
  try {
    console.log(' Creating stock-in with data:', data);

    if (!data.supplierId || data.supplierId <= 0) {
      throw new Error('Invalid supplier ID');
    }
    
    if (!data.receivedDate) {
      throw new Error('Received date is required');
    }
    
    if (!data.items || data.items.length === 0) {
      throw new Error('At least one item is required');
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
      console.error(' Stock-in error response:', errorData);
      throw new Error(errorData.message || 'Failed to create stock-in');
    }
    
    const result = await response.json();
    console.log(' Stock-in response:', result);
    
    if (result.status === 'success' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error creating stock-in:', error);
    throw error;
  }
}

// Stock-Out operation
export async function createStockOut(data: StockOutRequest): Promise<StockOutResponse> {
  try {
    console.log(' Creating stock-out with data:', data);
    
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
      console.error(' Stock-out error response:', errorData);
      throw new Error(errorData.message || 'Failed to create stock-out');
    }
    
    const result = await response.json();
    console.log(' Stock-out response:', result);
    
    if (result.status === 'success' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error creating stock-out:', error);
    throw error;
  }
}

// Get low stock items
export async function getLowStockItems(): Promise<Stock[]> {
  try {
    console.log(' Fetching low stock items');
    
    const result = await fetchStocks({ lowStock: true });
    return result.items;
  } catch (error) {
    console.error(' Error fetching low stock items:', error);
    throw error;
  }
}

// // Get stock summary statistics
// export async function getStockSummary(): Promise<{
//   totalProducts: number
//   lowStockItems: number
//   outOfStockItems: number
//   totalValue: number
// }> {
//   try {
//     console.log(' Fetching stock summary');
    
//     // Fetch all stocks to calculate summary
//     const allStocks = await fetchStocks({ limit: 1000 }); // Get all items
    
//     const totalProducts = allStocks.items.length;
//     const lowStockItems = allStocks.items.filter(stock => 
//       stock.quantityAvailable <= stock.reorderLevel
//     ).length;
//     const outOfStockItems = allStocks.items.filter(stock => 
//       stock.quantityAvailable === 0
//     ).length;
    
//     // Note: Total value calculation would require cost information
//     const totalValue = 0; // Would need unit cost data
    
//     return {
//       totalProducts,
//       lowStockItems,
//       outOfStockItems,
//       totalValue
//     };
//   } catch (error) {
//     console.error(' Error fetching stock summary:', error);
//     throw error;
//   }
// }

// Bulk import stock from CSV
export async function importStockFromCSV(file: File): Promise<{
  totalRows: number;
  processedCount: number;
  successCount: number;
  errorCount: number;
  errors: string[] | null;
  summary: {
    created: number;
    updated: number;
  };
}> {
  try {
    console.log(' Uploading CSV file for stock import:', file.name);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/import`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Stock import error response:', errorData);
      throw new Error(errorData.message || 'Failed to import stock');
    }

    const result = await response.json();
    console.log(' Stock import response:', result);

    if (result.status === 'success' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error importing stock:', error);
    throw error;
  }
}

// Export stock data to CSV
// export function exportStockToCSV(stocks: Stock[], filename?: string): void {
//   try {
//     console.log(' Exporting stock data to CSV:', stocks.length, 'records');

//     // Define CSV headers
//     const headers = [
//       'Stock ID',
//       'Product ID',
//       'Product Name',
//       'Product SKU',
//       'Brand Name',
//       'Category Name',
//       'Variation ID',
//       'Variation Name',
//       'Variation Color',
//       'Variation Size',
//       'Variation Capacity',
//       'Quantity Available',
//       'Reorder Level',
//       'Location',
//       'Last Updated Date'
//     ];

//     // Convert stock data to CSV rows
//     const csvRows = stocks.map(stock => {
//       return [
//         stock.stockId?.toString() || '',
//         stock.productId?.toString() || '',
//         stock.productName || '',
//         stock.productSku || '',
//         stock.brandName || '',
//         stock.categoryName || '',
//         stock.variationId?.toString() || '',
//         stock.variationName || '',
//         stock.variationColor || '',
//         stock.variationSize || '',
//         stock.variationCapacity || '',
//         stock.quantityAvailable?.toString() || '0',
//         stock.reorderLevel?.toString() || '0',
//         stock.location || '',
//         stock.lastUpdatedDate ? new Date(stock.lastUpdatedDate).toISOString() : ''
//       ].map(field => {
//         // Escape fields that contain commas, quotes, or newlines
//         if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
//           return `"${field.replace(/"/g, '""')}"`;
//         }
//         return field;
//       });
//     });

//     // Combine headers and rows
//     const csvContent = [
//       headers.join(','),
//       ...csvRows.map(row => row.join(','))
//     ].join('\n');

//     // Create blob and download
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     const url = URL.createObjectURL(blob);
    
//     link.setAttribute('href', url);
//     link.setAttribute('download', filename || `stock_export_${new Date().toISOString().split('T')[0]}.csv`);
//     link.style.visibility = 'hidden';
    
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     // Clean up the URL object
//     URL.revokeObjectURL(url);

//     console.log(' Stock data exported successfully');
//   } catch (error) {
//     console.error(' Error exporting stock data:', error);
//     throw new Error('Failed to export stock data to CSV');
//   }
// }




export async function exportStockToCSV(stocks: Stock[], filename?: string): Promise<void> {
  try {
    console.log(' Exporting stock data to CSV:', stocks.length, 'records');

    // Define CSV headers
    const headers = [
      'Stock ID',
      'Product ID',
      'Product Name',
      'Product SKU',
      'Brand Name',
      'Category Name',
      'Variation ID',
      'Variation Name',
      'Variation Color',
      'Variation Size',
      'Variation Capacity',
      'Quantity Available',
      'Reorder Level',
      'Location',
      'Last Updated Date'
    ];

    // Convert stock data to CSV rows
    const csvRows = stocks.map(stock => {
      return [
        stock.stockId?.toString() || '',
        stock.productId?.toString() || '',
        stock.productName || '',
        stock.productSku || '',
        stock.brandName || '',
        stock.categoryName || '',
        stock.variationId?.toString() || '',
        stock.variationName || '',
        stock.variationColor || '',
        stock.variationSize || '',
        stock.variationCapacity || '',
        stock.quantityAvailable?.toString() || '0',
        stock.reorderLevel?.toString() || '0',
        stock.location || '',
        stock.lastUpdatedDate ? new Date(stock.lastUpdatedDate).toISOString() : ''
      ].map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const finalFilename = filename || `stock_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);

    // Track export in database
    try {
      await fetch('/api/stock/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fileName: finalFilename,
          recordCount: stocks.length,
          remarks: `Stock export - ${stocks.length} records`
        })
      });
      console.log(' Export tracked in database');
    } catch (trackingError) {
      console.error(' Failed to track export (non-critical):', trackingError);
      // Don't throw - export was successful, tracking is just for audit
    }

    console.log(' Stock data exported successfully');
  } catch (error) {
    console.error(' Error exporting stock data:', error);
    throw new Error('Failed to export stock data to CSV');
  }
}