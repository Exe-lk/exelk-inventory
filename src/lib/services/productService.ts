// import { Product, CreateProductRequest, UpdateProductRequest } from '@/types/product';
// import { ProductVersion } from '@/types/productversion';
// import { ProductVariation } from '@/types/productvariation';
// import { Specs } from '@/types/specs';
// import { SpecDetail } from '@/types/specdetails';

// const API_BASE_URL = '/api/product';

// export interface ProductResponse {
//   status: string;
//   code: number;
//   message: string;
//   timestamp: string;
//   data?: {
//     items: Product[];
//     pagination: {
//       totalItems: number;
//       page: number;
//       limit: number;
//       totalPages: number;
//     };
//   };
// }

// export interface SingleProductResponse {
//   status: string;
//   code: number;
//   message: string;
//   timestamp: string;
//   data?: Product;
// }

// // Comprehensive product creation request
// export interface CreateCompleteProductRequest {
//   // Product data
//   product: {
//     sku: string;
//     productName: string;
//     description: string;
//     categoryId: number;
//     brandId: number;
//     modelId: number;
//     supplierId: number;
//     isActive?: boolean;
//   };
  
//   // Product version data
//   productVersion: {
//     versionNumber: string;
//     releaseDate: string;
//     isActive?: boolean;
//   };
  
//   // Product variation data
//   productVariation: {
//     variationName: string;
//     color?: string;
//     size?: string;
//     capacity?: string;
//     barcode?: string;
//     price?: number;
//     quantity?: number;
//     minStockLevel?: number;
//     maxStockLevel?: number;
//     isActive?: boolean;
//   };
  
//   // Specs data (array of specifications)
//   specs: Array<{
//     specName: string;
//     specDescription: string;
//     dataType: string;
//     specValue: string;
//     isActive?: boolean;
//   }>;
// }

// export interface CompleteProductResponse {
//   status: string;
//   code: number;
//   message: string;
//   timestamp: string;
//   data?: {
//     product: Product;
//     productVersion: ProductVersion;
//     productVariation: ProductVariation;
//     specs: Specs[];
//     specDetails: SpecDetail[];
//   };
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

// // Create complete product with all related data
// export async function createCompleteProduct(productData: CreateCompleteProductRequest): Promise<CompleteProductResponse['data']> {
//   try {
//     console.log('Sending complete product data:', productData);
    
//     const response = await fetch(`${API_BASE_URL}/complete`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//       body: JSON.stringify(productData),
//     });

//     console.log('Response status:', response.status);
    
//     const responseText = await response.text();
//     console.log('Response text:', responseText);

//     if (!response.ok) {
//       try {
//         const errorData = JSON.parse(responseText);
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       } catch (parseError) {
//         console.error('Failed to parse error response:', parseError);
//         throw new Error(`HTTP error! status: ${response.status} - ${responseText}`);
//       }
//     }

//     let data: CompleteProductResponse;
//     try {
//       data = JSON.parse(responseText);
//     } catch (parseError) {
//       console.error('Failed to parse success response:', parseError);
//       throw new Error('Invalid response format from server');
//     }
    
//     if (data.status === 'success' && data.data) {
//       return data.data;
//     } else {
//       throw new Error(data.message || 'Failed to create complete product');
//     }
//   } catch (error) {
//     console.error('Error creating complete product:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while creating the complete product');
//   }
// }

// // Create a new product (simple)
// export async function createProduct(productData: CreateProductRequest): Promise<Product> {
//   try {
//     const response = await fetch(API_BASE_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//       body: JSON.stringify(productData),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//     }

//     const data: SingleProductResponse = await response.json();
    
//     if (data.status === 'success' && data.data) {
//       return data.data;
//     } else {
//       throw new Error(data.message || 'Failed to create product');
//     }
//   } catch (error) {
//     console.error('Error creating product:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while creating the product');
//   }
// }

// // Update an existing product
// export async function updateProduct(productId: number, updateData: UpdateProductRequest): Promise<Product> {
//   try {
//     const response = await fetch(API_BASE_URL, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//       body: JSON.stringify({ productId, ...updateData }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//     }

//     const data: SingleProductResponse = await response.json();
    
//     if (data.status === 'success' && data.data) {
//       return data.data;
//     } else {
//       throw new Error(data.message || 'Failed to update product');
//     }
//   } catch (error) {
//     console.error('Error updating product:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while updating the product');
//   }
// }

// // Delete a product
// export async function deleteProduct(productId: number): Promise<void> {
//   try {
//     const response = await fetch(`${API_BASE_URL}?productId=${productId}`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
    
//     if (data.status !== 'success') {
//       throw new Error(data.message || 'Failed to delete product');
//     }
//   } catch (error) {
//     console.error('Error deleting product:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while deleting the product');
//   }
// }

// // Get product by ID
// export async function getProductById(productId: number): Promise<Product | null> {
//   try {
//     const products = await fetchProducts();
//     return products.find(product => product.productId === productId) || null;
//   } catch (error) {
//     console.error('Error getting product by ID:', error);
//     throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching the product');
//   }
// }

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
export async function fetchBrands(): Promise<Brand[]> {
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
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    
    // Handle different response formats
    if (data.status === 'success' && data.data) {
      return data.data.items || data.data || [];
    } else {
      return data.items || data || [];
    }
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching brands');
  }
}

// Fetch categories - matching model page pattern
export async function fetchCategories(): Promise<Category[]> {
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
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    
    // Handle different response formats
    if (data.status === 'success' && data.data) {
      return data.data.items || data.data || [];
    } else {
      return data.items || data || [];
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching categories');
  }
}

// Fetch models - matching model page pattern
export async function fetchModels(): Promise<Model[]> {
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
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    
    // Handle different response formats
    if (data.status === 'success' && data.data) {
      return data.data.items || data.data || [];
    } else {
      return data.items || data || [];
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching models');
  }
}

// Fetch suppliers - matching model page pattern
export async function fetchSuppliers(): Promise<Supplier[]> {
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
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    
    // Handle different response formats
    if (data.status === 'success' && data.data) {
      return data.data.items || data.data || [];
    } else {
      return data.items || data || [];
    }
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching suppliers');
  }
}

// Fetch all products with pagination and filters
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
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data: ProductResponse = await response.json();
    
    if (data.status === 'success' && data.data) {
      return data.data.items;
    } else {
      throw new Error(data.message || 'Failed to fetch products');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred while fetching products');
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