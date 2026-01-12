
import { Product, CreateProductRequest, UpdateProductRequest } from '@/types/product';
import { ProductVersion } from '@/types/productversion';
import { ProductVariation } from '@/types/productvariation';
import { Specs } from '@/types/specs';
import { SpecDetail } from '@/types/specdetails';

const API_BASE_URL = '/api/product';

// Interfaces for dropdown data - matching model page pattern
export interface Brand {
  BrandID: number;
  BrandName: string;
  IsActive: boolean;
}

export interface Category {
  CategoryID: number;
  CategoryName: string;
  IsActive: boolean;
}

export interface Model {
  ModelID: number;
  ModelName: string;
  IsActive: boolean;
}

export interface Supplier {
  SupplierID: number;
  SupplierName: string;
  IsActive: boolean;
}

export interface ProductResponse {
  status: string;
  code: number;
  message: string;
  timestamp: string;
  data?: {
    items: Product[];
    pagination: {
      totalItems: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface SingleProductResponse {
  status: string;
  code: number;
  message: string;
  timestamp: string;
  data?: Product;
}

// Comprehensive product creation request
export interface CreateCompleteProductRequest {
  // Product data
  product: {
    sku: string;
    productName: string;
    description: string;
    categoryId: number;
    brandId: number;
    modelId: number;
    supplierId: number;
    isActive?: boolean;
  };
  
  // Product version data
  productVersion: {
    versionNumber: string;
    releaseDate: string;
    isActive?: boolean;
  };
  
  // Product variation data
  productVariation: {
    variationName: string;
    color?: string;
    size?: string;
    capacity?: string;
    barcode?: string;
    price?: number;
    quantity?: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    isActive?: boolean;
  };
  
  // Specs data (array of specifications)
  specs: Array<{
    specName: string;
    specValue: string;
  }>;
}

export interface CompleteProductResponse {
  status: string;
  code: number;
  message: string;
  timestamp: string;
  data?: {
    product: Product;
    productVersion: ProductVersion;
    productVariation: ProductVariation;
    specs: Specs[];
    specDetails: SpecDetail[];
  };
}

// Fetch brands - matching model page pattern
// export async function fetchBrands(): Promise<Brand[]> {
//   try {
//     const response = await fetch('/api/brand', {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('Fetch brands error response:', errorText);
      
//       try {
//         const errorData = JSON.parse(errorText);
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       } catch {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//     }

//     const data = await response.json();
    
//     // Handle different response formats
//     if (data.status === 'success' && data.data) {
//       return data.data.items || data.data || [];
//     } else {
//       return data.items || data || [];
//     }
//   } catch (error) {
//     console.error('Error fetching brands:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching brands');
//   }
// }

// // Fetch categories - matching model page pattern
// export async function fetchCategories(): Promise<Category[]> {
//   try {
//     const response = await fetch('/api/category', {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('Fetch categories error response:', errorText);
      
//       try {
//         const errorData = JSON.parse(errorText);
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       } catch {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//     }

//     const data = await response.json();
    
//     // Handle different response formats
//     if (data.status === 'success' && data.data) {
//       return data.data.items || data.data || [];
//     } else {
//       return data.items || data || [];
//     }
//   } catch (error) {
//     console.error('Error fetching categories:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching categories');
//   }
// }

// // Fetch models - matching model page pattern
// export async function fetchModels(): Promise<Model[]> {
//   try {
//     const response = await fetch('/api/model', {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('Fetch models error response:', errorText);
      
//       try {
//         const errorData = JSON.parse(errorText);
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       } catch {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//     }

//     const data = await response.json();
    
//     // Handle different response formats
//     if (data.status === 'success' && data.data) {
//       return data.data.items || data.data || [];
//     } else {
//       return data.items || data || [];
//     }
//   } catch (error) {
//     console.error('Error fetching models:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching models');
//   }
// }

// // Fetch suppliers - matching model page pattern
// export async function fetchSuppliers(): Promise<Supplier[]> {
//   try {
//     const response = await fetch('/api/supplier', {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('Fetch suppliers error response:', errorText);
      
//       try {
//         const errorData = JSON.parse(errorText);
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       } catch {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//     }

//     const data = await response.json();
    
//     // Handle different response formats
//     if (data.status === 'success' && data.data) {
//       return data.data.items || data.data || [];
//     } else {
//       return data.items || data || [];
//     }
//   } catch (error) {
//     console.error('Error fetching suppliers:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching suppliers');
//   }
// }

// // Fetch all products with pagination and filters
// export async function fetchProducts(params?: {
//   page?: number;
//   limit?: number;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
//   search?: string;
//   categoryId?: number;
//   brandId?: number;
//   modelId?: number;
//   supplierId?: number;
//   isActive?: boolean;
// }): Promise<Product[]> {
//   try {
//     const searchParams = new URLSearchParams();
    
//     if (params?.page) searchParams.append('page', params.page.toString());
//     if (params?.limit) searchParams.append('limit', params.limit.toString());
//     if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
//     if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
//     if (params?.search) searchParams.append('search', params.search);
//     if (params?.categoryId) searchParams.append('categoryId', params.categoryId.toString());
//     if (params?.brandId) searchParams.append('brandId', params.brandId.toString());
//     if (params?.modelId) searchParams.append('modelId', params.modelId.toString());
//     if (params?.supplierId) searchParams.append('supplierId', params.supplierId.toString());
//     if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

//     const url = `${API_BASE_URL}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('Fetch products error response:', errorText);
      
//       try {
//         const errorData = JSON.parse(errorText);
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       } catch {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//     }

//     const data: ProductResponse = await response.json();
    
//     if (data.status === 'success' && data.data) {
//       return data.data.items;
//     } else {
//       throw new Error(data.message || 'Failed to fetch products');
//     }
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching products');
//   }
// }


// Add cache duration constant at the top (after imports, around line 8)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for dropdown data
const PRODUCTS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for products list

// ... existing code ...

// Update fetchBrands function (around line 116)
export async function fetchBrands(): Promise<Brand[]> {
  const cacheKey = 'brands_cache';
  
  // Check for cached data
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log(' Using cached brands data');
        return data;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn(' Failed to read brands cache:', error);
  }
  
  try {
    const response = await fetch('/api/brand', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch brands error response:', errorText);
      
      // Try stale cache on error
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log(' Using stale cache due to fetch error');
          return data;
        }
      } catch (fallbackError) {
        // Ignore
      }
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    
    let brands: Brand[] = [];
    if (data.status === 'success' && data.data) {
      brands = data.data.items || data.data || [];
    } else {
      brands = data.items || data || [];
    }
    
    // Cache the successful response
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: brands,
        timestamp: Date.now()
      }));
      console.log(' Brands data cached successfully');
    } catch (cacheError) {
      console.warn(' Failed to cache brands data:', cacheError);
    }
    
    return brands;
  } catch (error) {
    console.error('Error fetching brands:', error);
    
    // Try stale cache on error
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log(' Using stale cache due to fetch error');
        return data;
      }
    } catch (fallbackError) {
      // Ignore
    }
    
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching brands');
  }
}

// Update fetchCategories function (around line 153) - Same pattern
export async function fetchCategories(): Promise<Category[]> {
  const cacheKey = 'categories_cache';
  
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log(' Using cached categories data');
        return data;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn(' Failed to read categories cache:', error);
  }
  
  try {
    const response = await fetch('/api/category', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch categories error response:', errorText);
      
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log(' Using stale cache due to fetch error');
          return data;
        }
      } catch (fallbackError) {
        // Ignore
      }
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    
    let categories: Category[] = [];
    if (data.status === 'success' && data.data) {
      categories = data.data.items || data.data || [];
    } else {
      categories = data.items || data || [];
    }
    
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: categories,
        timestamp: Date.now()
      }));
      console.log(' Categories data cached successfully');
    } catch (cacheError) {
      console.warn(' Failed to cache categories data:', cacheError);
    }
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log(' Using stale cache due to fetch error');
        return data;
      }
    } catch (fallbackError) {
      // Ignore
    }
    
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching categories');
  }
}

// Update fetchModels function (around line 190) - Same pattern
export async function fetchModels(): Promise<Model[]> {
  const cacheKey = 'models_cache';
  
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log(' Using cached models data');
        return data;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn(' Failed to read models cache:', error);
  }
  
  try {
    const response = await fetch('/api/model', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch models error response:', errorText);
      
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log(' Using stale cache due to fetch error');
          return data;
        }
      } catch (fallbackError) {
        // Ignore
      }
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    
    let models: Model[] = [];
    if (data.status === 'success' && data.data) {
      models = data.data.items || data.data || [];
    } else {
      models = data.items || data || [];
    }
    
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: models,
        timestamp: Date.now()
      }));
      console.log(' Models data cached successfully');
    } catch (cacheError) {
      console.warn(' Failed to cache models data:', cacheError);
    }
    
    return models;
  } catch (error) {
    console.error('Error fetching models:', error);
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log(' Using stale cache due to fetch error');
        return data;
      }
    } catch (fallbackError) {
      // Ignore
    }
    
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching models');
  }
}

// Update fetchSuppliers function (around line 227) - Same pattern
export async function fetchSuppliers(): Promise<Supplier[]> {
  const cacheKey = 'suppliers_cache';
  
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log(' Using cached suppliers data');
        return data;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn(' Failed to read suppliers cache:', error);
  }
  
  try {
    const response = await fetch('/api/supplier', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch suppliers error response:', errorText);
      
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log(' Using stale cache due to fetch error');
          return data;
        }
      } catch (fallbackError) {
        // Ignore
      }
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    
    let suppliers: Supplier[] = [];
    if (data.status === 'success' && data.data) {
      suppliers = data.data.items || data.data || [];
    } else {
      suppliers = data.items || data || [];
    }
    
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: suppliers,
        timestamp: Date.now()
      }));
      console.log(' Suppliers data cached successfully');
    } catch (cacheError) {
      console.warn(' Failed to cache suppliers data:', cacheError);
    }
    
    return suppliers;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log(' Using stale cache due to fetch error');
        return data;
      }
    } catch (fallbackError) {
      // Ignore
    }
    
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching suppliers');
  }
}

// Update fetchProducts function (around line 264) - Add caching with query params as cache key
export async function fetchProducts(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  categoryId?: number;
  brandId?: number;
  modelId?: number;
  supplierId?: number;
  isActive?: boolean;
}): Promise<Product[]> {
  // Create cache key based on query params
  const cacheKey = `products_cache_${JSON.stringify(params || {})}`;
  
  // Check for cached data
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < PRODUCTS_CACHE_DURATION) {
        console.log(' Using cached products data');
        return data;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn(' Failed to read products cache:', error);
  }
  
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId.toString());
    if (params?.brandId) searchParams.append('brandId', params.brandId.toString());
    if (params?.modelId) searchParams.append('modelId', params.modelId.toString());
    if (params?.supplierId) searchParams.append('supplierId', params.supplierId.toString());
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const url = `${API_BASE_URL}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch products error response:', errorText);
      
      // Try stale cache on error
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log(' Using stale cache due to fetch error');
          return data;
        }
      } catch (fallbackError) {
        // Ignore
      }
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data: ProductResponse = await response.json();
    
    let products: Product[] = [];
    if (data.status === 'success' && data.data) {
      products = data.data.items;
    } else {
      throw new Error(data.message || 'Failed to fetch products');
    }
    
    // Cache the successful response
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: products,
        timestamp: Date.now()
      }));
      console.log(' Products data cached successfully');
    } catch (cacheError) {
      console.warn(' Failed to cache products data:', cacheError);
    }
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Try stale cache on error
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log(' Using stale cache due to fetch error');
        return data;
      }
    } catch (fallbackError) {
      // Ignore
    }
    
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching products');
  }
}

// Add cache invalidation helper functions (add after fetchProducts function)
export function clearProductCache(): void {
  try {
    // Clear all product-related caches
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('products_cache_') || 
          key === 'brands_cache' || 
          key === 'categories_cache' || 
          key === 'models_cache' || 
          key === 'suppliers_cache') {
        sessionStorage.removeItem(key);
      }
    });
    console.log(' Product-related caches cleared');
  } catch (error) {
    console.warn(' Failed to clear product cache:', error);
  }
}

export function clearDropdownCache(): void {
  try {
    sessionStorage.removeItem('brands_cache');
    sessionStorage.removeItem('categories_cache');
    sessionStorage.removeItem('models_cache');
    sessionStorage.removeItem('suppliers_cache');
    console.log(' Dropdown caches cleared');
  } catch (error) {
    console.warn(' Failed to clear dropdown cache:', error);
  }
}


// Create complete product with all related data
export async function createCompleteProduct(productData: CreateCompleteProductRequest): Promise<CompleteProductResponse['data']> {
  try {
    console.log('Sending complete product data:', productData);
    
    const response = await fetch(`${API_BASE_URL}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(productData),
    });

    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        throw new Error(`HTTP error! status: ${response.status} - ${responseText}`);
      }
    }

    let data: CompleteProductResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse success response:', parseError);
      throw new Error('Invalid response format from server');
    }
    
    if (data.status === 'success' && data.data) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create complete product');
    }
  } catch (error) {
    console.error('Error creating complete product:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while creating the complete product');
  }
}

// Create a new product (simple)
export async function createProduct(productData: CreateProductRequest): Promise<Product> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: SingleProductResponse = await response.json();
    
    if (data.status === 'success' && data.data) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create product');
    }
  } catch (error) {
    console.error('Error creating product:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while creating the product');
  }
}

// Update an existing product
export async function updateProduct(productId: number, updateData: UpdateProductRequest): Promise<Product> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ productId, ...updateData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: SingleProductResponse = await response.json();
    
    if (data.status === 'success' && data.data) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while updating the product');
  }
}

// Delete a product
export async function deleteProduct(productId: number): Promise<void> {
  try {
    console.log('Deleting product:', productId);
    
    const response = await fetch(`${API_BASE_URL}?productId=${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    console.log('Delete response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch (parseError) {
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Delete response data:', data);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while deleting the product');
  }
}

// Get product by ID
export async function getProductById(productId: number): Promise<Product | null> {
  try {
    const products = await fetchProducts();
    return products.find(product => product.productId === productId) || null;
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching the product');
  }
}




// Bulk import products from CSV
export async function importProductFromCSV(file: File): Promise<{
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
    console.log(' Uploading CSV file for product import:', file.name);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/import`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Product import error response:', errorData);
      throw new Error(errorData.message || 'Failed to import products');
    }

    const result = await response.json();
    console.log(' Product import response:', result);

    if (result.status === 'success' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error importing products:', error);
    throw error;
  }
}



// Export product data to CSV
export async function exportProductToCSV(products: Product[], filename?: string): Promise<void> {
  try {
    console.log(' Exporting product data to CSV:', products.length, 'records');

    // Define CSV headers matching product table structure
    const headers = [
      'productId',
      'sku',
      'productName',
      'description',
      'categoryId',
      'brandId',
      'modelId',
      'supplierId',
      'isActive',
      'createdAt',
      'updatedAt'
    ];

    // Convert product data to CSV rows
    const csvRows = products.map(product => {
      return [
        product.productId?.toString() || '',
        product.sku || '',
        product.productName || '',
        product.description || '',
        product.categoryId?.toString() || '',
        product.brandId?.toString() || '',
        product.modelId?.toString() || '',
        product.supplierId?.toString() || '',
        product.isActive ? 'true' : 'false',
        product.createdAt ? new Date(product.createdAt).toISOString() : '',
        product.updatedAt ? new Date(product.updatedAt).toISOString() : ''
      ].map(field => {
        // Escape fields that contain commas, quotes, or newlines
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
    const finalFilename = filename || `product_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);

    // Track export (optional - non-blocking)
    try {
      await fetch(`${API_BASE_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fileName: finalFilename,
          recordCount: products.length,
          remarks: `Product export - ${products.length} records`
        })
      });
    } catch (trackError) {
      console.warn(' Failed to track export:', trackError);
      // Non-critical, continue
    }

    console.log(' Product data exported successfully');
  } catch (error) {
    console.error(' Error exporting product data:', error);
    throw new Error('Failed to export product data to CSV');
  }
}