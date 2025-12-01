import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

// Allowed main category values
const ALLOWED_MAIN_CATEGORIES = ['Laptop', 'Desktop', 'Accessories'];

// Helper function to extract employee ID from token
function getEmployeeIdFromToken(accessToken: string): number {
  try {
    const payload = verifyAccessToken(accessToken);
    // Assuming the token payload contains userId which is the EmployeeID
    return payload.userId || 1; // fallback to 1 if not found
  } catch (error) {
    console.error('Error extracting employee ID from token:', error);
    return 1; // fallback employee ID
  }
}

// GET - Retrieve categories
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    try {
      verifyAccessToken(accessToken)
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const sortBy = searchParams.get('sortBy') || 'categoryName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with updated column names
    let query = supabase
      .from('category')
      .select(`
        categoryId,
        categoryName,
        description,
        mainCategory,
        isActive,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`categoryName.ilike.%${search}%,description.ilike.%${search}%,mainCategory.ilike.%${search}%`)
    }

    // Apply sorting
    const validSortColumns = ['categoryName', 'description', 'mainCategory', 'createdAt', 'isActive']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'categoryName'
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    console.log('Executing query...')
    const { data: categories, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve categories from database',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log('Categories fetched:', categories?.length)
    console.log('Sample category:', categories?.[0])

    // Transform data to match frontend expectations
    const transformedCategories = categories?.map(category => ({
      categoryID: category.categoryId,
      categoryName: category.categoryName,
      description: category.description || '',
      mainCategory: category.mainCategory,
      isActive: category.isActive,
      createdAt: category.createdAt,
      createdBy: category.createdBy || 1,
      updatedAt: category.updatedAt || category.createdAt,
      updatedBy: category.updatedBy || 1
    })) || []

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Categories retrieved successfully',
        timestamp: new Date().toISOString(),
        data: {
          items: transformedCategories,
          pagination: {
            totalItems: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    // Extract employee ID from token
    let employeeId: number;
    try {
      const payload = verifyAccessToken(accessToken);
      employeeId = getEmployeeIdFromToken(accessToken);
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { categoryName, description, mainCategory, isActive = true } = body

    console.log('Received data:', { categoryName, description, mainCategory, isActive });
    console.log('Employee ID from token:', employeeId);

    // Validate required fields
    if (!categoryName) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Category name is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Description is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate main category if provided (fixed values validation)
    if (mainCategory && !ALLOWED_MAIN_CATEGORIES.includes(mainCategory)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: `Invalid main category. Must be one of: ${ALLOWED_MAIN_CATEGORIES.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if category name already exists
    const { data: existingCategory, error: checkError } = await supabase
      .from('category')
      .select('categoryId')
      .eq('categoryName', categoryName)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing category:', checkError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to check existing category',
          error: checkError.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    if (existingCategory) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 409,
          message: 'Category name already exists',
          timestamp: new Date().toISOString()
        },
        { status: 409 }
      )
    }

    // Prepare insert data with employee ID from auth token
    const currentTimestamp = new Date().toISOString();
    const insertData = {
      categoryName: categoryName,
      description: description,
      mainCategory: mainCategory || null,
      isActive: isActive,
      createdAt: currentTimestamp,
      createdBy: employeeId, // Use employee ID from auth token
      updatedAt: currentTimestamp,
      updatedBy: employeeId  // Use employee ID from auth token
    };

    console.log('Insert data:', insertData);

    // Create new category
    const { data: newCategory, error } = await supabase
      .from('category')
      .insert([insertData])
      .select(`
        categoryId,
        categoryName,
        description,
        mainCategory,
        isActive,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create category',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log('Created category:', newCategory);

    // Transform response
    const transformedCategory = {
      categoryID: newCategory.categoryId,
      categoryName: newCategory.categoryName,
      description: newCategory.description,
      mainCategory: newCategory.mainCategory,
      isActive: newCategory.isActive,
      createdAt: newCategory.createdAt,
      createdBy: newCategory.createdBy,
      updatedAt: newCategory.updatedAt,
      updatedBy: newCategory.updatedBy
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 201,
        message: 'Category created successfully',
        timestamp: new Date().toISOString(),
        data: transformedCategory
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    // Extract employee ID from token
    let employeeId: number;
    try {
      const payload = verifyAccessToken(accessToken);
      employeeId = getEmployeeIdFromToken(accessToken);
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { categoryID, categoryName, description, mainCategory, isActive } = body

    console.log('Update - Employee ID from token:', employeeId);

    // Validate required fields
    if (!categoryID) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Category ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate main category if provided (fixed values validation)
    if (mainCategory && !ALLOWED_MAIN_CATEGORIES.includes(mainCategory)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: `Invalid main category. Must be one of: ${ALLOWED_MAIN_CATEGORIES.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('category')
      .select('categoryId')
      .eq('categoryId', categoryID)
      .single()

    if (!existingCategory) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Category not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Check if category name already exists (excluding current category)
    if (categoryName) {
      const { data: duplicateCategory, error: duplicateError } = await supabase
        .from('category')
        .select('categoryId')
        .eq('categoryName', categoryName)
        .neq('categoryId', categoryID)
        .maybeSingle()

      if (duplicateError) {
        console.error('Error checking duplicate category name:', duplicateError);
        return NextResponse.json(
          { 
            status: 'error',
            code: 500,
            message: 'Failed to check duplicate category name',
            error: duplicateError.message,
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        )
      }

      if (duplicateCategory) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'Category name already exists',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }
    }

    // Prepare update data with employee ID from auth token
    const updateData: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId // Use employee ID from auth token
    }
    if (categoryName !== undefined) updateData.categoryName = categoryName
    if (description !== undefined) updateData.description = description
    if (mainCategory !== undefined) updateData.mainCategory = mainCategory || null
    if (isActive !== undefined) updateData.isActive = isActive

    console.log('Update data:', updateData);

    // Update category
    const { data: updatedCategory, error } = await supabase
      .from('category')
      .update(updateData)
      .eq('categoryId', categoryID)
      .select(`
        categoryId,
        categoryName,
        description,
        mainCategory,
        isActive,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update category',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Transform response
    const transformedCategory = {
      categoryID: updatedCategory.categoryId,
      categoryName: updatedCategory.categoryName,
      description: updatedCategory.description,
      mainCategory: updatedCategory.mainCategory,
      isActive: updatedCategory.isActive,
      createdAt: updatedCategory.createdAt,
      createdBy: updatedCategory.createdBy,
      updatedAt: updatedCategory.updatedAt,
      updatedBy: updatedCategory.updatedBy
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Category updated successfully',
        timestamp: new Date().toISOString(),
        data: transformedCategory
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Categories PUT error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    try {
      verifyAccessToken(accessToken)
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const categoryID = searchParams.get('categoryID')

    if (!categoryID) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Category ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('category')
      .select('categoryId, categoryName')
      .eq('categoryId', parseInt(categoryID))
      .single()

    if (!existingCategory) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Category not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Check if category has child categories (now checking by category name)
    const { data: childCategories } = await supabase
      .from('category')
      .select('categoryId')
      .eq('mainCategory', existingCategory.categoryName)

    if (childCategories && childCategories.length > 0) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Cannot delete category with child categories',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Delete category
    const { error } = await supabase
      .from('category')
      .delete()
      .eq('categoryId', parseInt(categoryID))

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete category',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Category deleted successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}