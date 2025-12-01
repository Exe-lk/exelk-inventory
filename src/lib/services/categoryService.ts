import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category';

// Base URL for category API
const BASE_URL = '/api/category';

// Fetch all categories
export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch categories');
    }
    const result = await response.json();
    
    // Handle the nested response structure
    if (result.status === 'success' && result.data && result.data.items) {
      // Transform camelCase to PascalCase to match your types
      return result.data.items.map((item: any) => ({
        CategoryID: item.categoryID,
        CategoryName: item.categoryName,
        Description: item.description,
        MainCategory: item.mainCategory,
        IsActive: item.isActive,
        CreatedAt: item.createdAt,
        CreatedBy: item.createdBy || 1, // Default values for missing fields
        UpdatedAt: item.updatedAt || item.createdAt,
        UpdatedBy: item.updatedBy || 1,
        DeletedAt: item.deletedAt || null,
        DeletedBy: item.deletedBy || null
      }));
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Create category
export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  try {
    // Transform PascalCase to camelCase for API
    const apiData = {
      categoryName: data.CategoryName,
      description: data.Description,
      mainCategory: data.MainCategory,
      isActive: data.IsActive
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create category');
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      // Transform response back to PascalCase
      return {
        CategoryID: result.data.categoryID,
        CategoryName: result.data.categoryName,
        Description: result.data.description,
        MainCategory: result.data.mainCategory,
        IsActive: result.data.isActive,
        CreatedAt: result.data.createdAt,
        CreatedBy: 1, // Default values
        UpdatedAt: result.data.createdAt,
        UpdatedBy: 1,
        DeletedAt: null,
        DeletedBy: null
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Update category
export async function updateCategory(id: number, data: UpdateCategoryRequest): Promise<Category> {
  try {
    // Transform PascalCase to camelCase for API
    const apiData = {
      categoryID: id,
      ...(data.CategoryName && { categoryName: data.CategoryName }),
      ...(data.Description && { description: data.Description }),
      ...(data.MainCategory !== undefined && { mainCategory: data.MainCategory }),
      ...(data.IsActive !== undefined && { isActive: data.IsActive })
    };

    const response = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update category');
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      // Transform response back to PascalCase
      return {
        CategoryID: result.data.categoryID,
        CategoryName: result.data.categoryName,
        Description: result.data.description,
        MainCategory: result.data.mainCategory,
        IsActive: result.data.isActive,
        CreatedAt: result.data.createdAt,
        CreatedBy: 1, // Default values
        UpdatedAt: new Date().toISOString(),
        UpdatedBy: 1,
        DeletedAt: null,
        DeletedBy: null
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

// Delete category
export async function deleteCategory(id: number): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}?categoryID=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete category');
    }
    
    const result = await response.json();
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete category');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}