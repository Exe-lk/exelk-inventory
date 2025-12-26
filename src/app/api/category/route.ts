// import { NextRequest, NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase/server'
// import { verifyAccessToken } from '@/lib/jwt'
// import { getAuthTokenFromCookies } from '@/lib/cookies'

// // Allowed main category values
// const ALLOWED_MAIN_CATEGORIES = ['Laptop', 'Desktop', 'Accessories'];

// // Helper function to extract employee ID from token
// function getEmployeeIdFromToken(accessToken: string): number {
//   try {
//     const payload = verifyAccessToken(accessToken);
//     // Assuming the token payload contains userId which is the EmployeeID
//     return payload.userId || 1; // fallback to 1 if not found
//   } catch (error) {
//     console.error('Error extracting employee ID from token:', error);
//     return 1; // fallback employee ID
//   }
// }


// // GET - Retrieve categories
// export async function GET(request: NextRequest) {
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     try {
//       verifyAccessToken(accessToken)
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     const supabase = createServerClient()
//     const { searchParams } = new URL(request.url)

//     // Parse query parameters
//     const page = parseInt(searchParams.get('page') || '1')
//     const limit = parseInt(searchParams.get('limit') || '100')
//     const sortBy = searchParams.get('sortBy') || 'categoryName'
//     const sortOrder = searchParams.get('sortOrder') || 'asc'
//     const search = searchParams.get('search') || ''

//     // Calculate offset for pagination
//     const offset = (page - 1) * limit

//     // Build query with updated column names
//     let query = supabase
//       .from('category')
//       .select(`
//         categoryId,
//         categoryName,
//         description,
//         mainCategory,
//         isActive,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy
//       `, { count: 'exact' })

//     // Apply search filter
//     if (search) {
//       query = query.or(`categoryName.ilike.%${search}%,description.ilike.%${search}%,mainCategory.ilike.%${search}%`)
//     }

//     // Apply sorting
//     const validSortColumns = ['categoryName', 'description', 'mainCategory', 'createdAt', 'isActive']
//     const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'categoryName'
//     query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

//     // Apply pagination
//     query = query.range(offset, offset + limit - 1)

//     console.log('Executing query...')
//     const { data: categories, error, count } = await query

//     if (error) {
//       console.error('Database error:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to retrieve categories from database',
//           error: error.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     console.log('Categories fetched:', categories?.length)
//     console.log('Sample category:', categories?.[0])

//     // Transform data to match frontend expectations
//     const transformedCategories = categories?.map(category => ({
//       categoryID: category.categoryId,
//       categoryName: category.categoryName,
//       description: category.description || '',
//       mainCategory: category.mainCategory,
//       isActive: category.isActive,
//       createdAt: category.createdAt,
//       createdBy: category.createdBy || 1,
//       updatedAt: category.updatedAt || category.createdAt,
//       updatedBy: category.updatedBy || 1
//     })) || []

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Categories retrieved successfully',
//         timestamp: new Date().toISOString(),
//         data: {
//           items: transformedCategories,
//           pagination: {
//             totalItems: count || 0,
//             page,
//             limit,
//             totalPages: Math.ceil((count || 0) / limit)
//           }
//         }
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Categories GET error:', error)
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         error: error instanceof Error ? error.message : 'Unknown error',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     )
//   }
// }


// // POST - Create new category
// export async function POST(request: NextRequest) {
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     // Extract employee ID from token
//     let employeeId: number;
//     try {
//       const payload = verifyAccessToken(accessToken);
//       employeeId = getEmployeeIdFromToken(accessToken);
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     const body = await request.json()
//     const { categoryName, description, mainCategory, isActive = true } = body

//     console.log('Received data:', { categoryName, description, mainCategory, isActive });
//     console.log('Employee ID from token:', employeeId);

//     // Validate required fields
//     if (!categoryName) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Category name is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     if (!description) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Description is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Validate main category if provided (fixed values validation)
//     if (mainCategory && !ALLOWED_MAIN_CATEGORIES.includes(mainCategory)) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: `Invalid main category. Must be one of: ${ALLOWED_MAIN_CATEGORIES.join(', ')}`,
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     const supabase = createServerClient()

//     // Check if category name already exists
//     const { data: existingCategory, error: checkError } = await supabase
//       .from('category')
//       .select('categoryId')
//       .eq('categoryName', categoryName)
//       .maybeSingle()

//     if (checkError) {
//       console.error('Error checking existing category:', checkError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check existing category',
//           error: checkError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (existingCategory) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 409,
//           message: 'Category name already exists',
//           timestamp: new Date().toISOString()
//         },
//         { status: 409 }
//       )
//     }

//     // Prepare insert data with employee ID from auth token
//     const currentTimestamp = new Date().toISOString();
//     const insertData = {
//       categoryName: categoryName,
//       description: description,
//       mainCategory: mainCategory || null,
//       isActive: isActive,
//       createdAt: currentTimestamp,
//       createdBy: employeeId, // Use employee ID from auth token
//       updatedAt: currentTimestamp,
//       updatedBy: employeeId  // Use employee ID from auth token
//     };

//     console.log('Insert data:', insertData);

//     // Create new category
//     const { data: newCategory, error } = await supabase
//       .from('category')
//       .insert([insertData])
//       .select(`
//         categoryId,
//         categoryName,
//         description,
//         mainCategory,
//         isActive,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy
//       `)
//       .single()

//     if (error) {
//       console.error('Database error:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to create category',
//           error: error.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     console.log('Created category:', newCategory);

//     // Transform response
//     const transformedCategory = {
//       categoryID: newCategory.categoryId,
//       categoryName: newCategory.categoryName,
//       description: newCategory.description,
//       mainCategory: newCategory.mainCategory,
//       isActive: newCategory.isActive,
//       createdAt: newCategory.createdAt,
//       createdBy: newCategory.createdBy,
//       updatedAt: newCategory.updatedAt,
//       updatedBy: newCategory.updatedBy
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 201,
//         message: 'Category created successfully',
//         timestamp: new Date().toISOString(),
//         data: transformedCategory
//       },
//       { status: 201 }
//     )

//   } catch (error) {
//     console.error('Categories POST error:', error)
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         error: error instanceof Error ? error.message : 'Unknown error',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     )
//   }
// }


// // PUT - Update category
// export async function PUT(request: NextRequest) {
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     // Extract employee ID from token
//     let employeeId: number;
//     try {
//       const payload = verifyAccessToken(accessToken);
//       employeeId = getEmployeeIdFromToken(accessToken);
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     const body = await request.json()
//     const { categoryID, categoryName, description, mainCategory, isActive } = body

//     console.log('Update - Employee ID from token:', employeeId);

//     // Validate required fields
//     if (!categoryID) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Category ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Validate main category if provided (fixed values validation)
//     if (mainCategory && !ALLOWED_MAIN_CATEGORIES.includes(mainCategory)) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: `Invalid main category. Must be one of: ${ALLOWED_MAIN_CATEGORIES.join(', ')}`,
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     const supabase = createServerClient()

//     // Check if category exists
//     const { data: existingCategory } = await supabase
//       .from('category')
//       .select('categoryId')
//       .eq('categoryId', categoryID)
//       .single()

//     if (!existingCategory) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Category not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     // Check if category name already exists (excluding current category)
//     if (categoryName) {
//       const { data: duplicateCategory, error: duplicateError } = await supabase
//         .from('category')
//         .select('categoryId')
//         .eq('categoryName', categoryName)
//         .neq('categoryId', categoryID)
//         .maybeSingle()

//       if (duplicateError) {
//         console.error('Error checking duplicate category name:', duplicateError);
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 500,
//             message: 'Failed to check duplicate category name',
//             error: duplicateError.message,
//             timestamp: new Date().toISOString()
//           },
//           { status: 500 }
//         )
//       }

//       if (duplicateCategory) {
//         return NextResponse.json(
//           { 
//             status: 'error',
//             code: 409,
//             message: 'Category name already exists',
//             timestamp: new Date().toISOString()
//           },
//           { status: 409 }
//         )
//       }
//     }

//     // Prepare update data with employee ID from auth token
//     const updateData: any = {
//       updatedAt: new Date().toISOString(),
//       updatedBy: employeeId // Use employee ID from auth token
//     }
//     if (categoryName !== undefined) updateData.categoryName = categoryName
//     if (description !== undefined) updateData.description = description
//     if (mainCategory !== undefined) updateData.mainCategory = mainCategory || null
//     if (isActive !== undefined) updateData.isActive = isActive

//     console.log('Update data:', updateData);

//     // Update category
//     const { data: updatedCategory, error } = await supabase
//       .from('category')
//       .update(updateData)
//       .eq('categoryId', categoryID)
//       .select(`
//         categoryId,
//         categoryName,
//         description,
//         mainCategory,
//         isActive,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy
//       `)
//       .single()

//     if (error) {
//       console.error('Database error:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to update category',
//           error: error.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     // Transform response
//     const transformedCategory = {
//       categoryID: updatedCategory.categoryId,
//       categoryName: updatedCategory.categoryName,
//       description: updatedCategory.description,
//       mainCategory: updatedCategory.mainCategory,
//       isActive: updatedCategory.isActive,
//       createdAt: updatedCategory.createdAt,
//       createdBy: updatedCategory.createdBy,
//       updatedAt: updatedCategory.updatedAt,
//       updatedBy: updatedCategory.updatedBy
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Category updated successfully',
//         timestamp: new Date().toISOString(),
//         data: transformedCategory
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Categories PUT error:', error)
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         error: error instanceof Error ? error.message : 'Unknown error',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     )
//   }
// }


// // DELETE - Delete category
// export async function DELETE(request: NextRequest) {
//   try {
//     // Verify authentication
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     try {
//       verifyAccessToken(accessToken)
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     const { searchParams } = new URL(request.url)
//     const categoryID = searchParams.get('categoryID')

//     if (!categoryID) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Category ID is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     const supabase = createServerClient()

//     // Check if category exists
//     const { data: existingCategory } = await supabase
//       .from('category')
//       .select('categoryId, categoryName')
//       .eq('categoryId', parseInt(categoryID))
//       .single()

//     if (!existingCategory) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 404,
//           message: 'Category not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 404 }
//       )
//     }

//     // Check if category has child categories (now checking by category name)
//     const { data: childCategories } = await supabase
//       .from('category')
//       .select('categoryId')
//       .eq('mainCategory', existingCategory.categoryName)

//     if (childCategories && childCategories.length > 0) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Cannot delete category with child categories',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Delete category
//     const { error } = await supabase
//       .from('category')
//       .delete()
//       .eq('categoryId', parseInt(categoryID))

//     if (error) {
//       console.error('Database error:', error)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to delete category',
//           error: error.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     return NextResponse.json(
//       {
//         status: 'success',
//         code: 200,
//         message: 'Category deleted successfully',
//         timestamp: new Date().toISOString()
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Categories DELETE error:', error)
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         error: error instanceof Error ? error.message : 'Unknown error',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     )
//   }
// }



import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

// Allowed main category values
const ALLOWED_MAIN_CATEGORIES = ['Laptop', 'Desktop', 'Accessories'];

interface Category {
  categoryId: number
  categoryName: string
  description: string | null
  mainCategory: string | null
  isActive: boolean
  createdAt: Date
  createdBy: number
  updatedAt: Date
  updatedBy: number
  deletedAt: Date | null
  deletedBy: number | null
}

// Helper function to extract employee ID from token
function getEmployeeIdFromToken(accessToken: string): number {
  try {
    const payload = verifyAccessToken(accessToken);
    return payload.userId || 1;
  } catch (error) {
    console.error('Error extracting employee ID from token:', error);
    return 1;
  }
}

// GET - Retrieve categories with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Category GET request started');
  
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
      console.log(' No access token found');
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
      console.log(' Access token verified');
    } catch (error) {
      console.log(' Invalid access token:', error);
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

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const sortBy = searchParams.get('sortBy') || 'categoryName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const mainCategory = searchParams.get('mainCategory')
    const isActive = searchParams.get('isActive')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, mainCategory, isActive });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only get non-deleted categories
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { categoryName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { mainCategory: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Apply filters
    if (mainCategory) {
      where.mainCategory = mainCategory
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['categoryName', 'categoryId', 'description', 'mainCategory', 'isActive', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'categoryName'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {
      console.log(' Testing database connection...');
      await prisma.$connect();
      console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.category.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get categories with pagination
      console.log(' Fetching categories...');
      const categories: Category[] = await prisma.category.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          categoryId: true,
          categoryName: true,
          description: true,
          mainCategory: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      }) as Category[];

      console.log(` Found ${categories.length} categories`);

      // Transform data to match response format
      const transformedCategories = categories.map((category: any) => ({
        categoryID: category.categoryId,
        categoryName: category.categoryName,
        description: category.description,
        mainCategory: category.mainCategory,
        isActive: category.isActive,
        createdAt: category.createdAt,
        createdBy: category.createdBy || 1,
        updatedAt: category.updatedAt,
        updatedBy: category.updatedBy,
        deletedAt: category.deletedAt,
        deletedBy: category.deletedBy
      }));

      console.log(' Categories transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Categories retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedCategories,
            pagination: {
              totalItems: totalCount,
              page,
              limit,
              totalPages: Math.ceil(totalCount / limit)
            }
          }
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError);
      console.error(' Error details:', {
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      });
      
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve categories - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Categories GET error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
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

    let employeeId: number;
    try {
      verifyAccessToken(accessToken)
      employeeId = getEmployeeIdFromToken(accessToken)
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
    const { categoryName, description, mainCategory, isActive } = body

    console.log(' Received data:', { categoryName, description, mainCategory, isActive });
    console.log(' Employee ID from token:', employeeId);

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

    // Validate main category if provided
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

    try {
      // Check if category name already exists
      const existingCategory = await prisma.category.findFirst({
        where: {
          categoryName,
          deletedAt: null
        }
      })

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

      // Create new category
      const category = await prisma.category.create({
        data: {
          categoryName,
          description,
          mainCategory: mainCategory || null,
          isActive: isActive !== undefined ? isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        },
        select: {
          categoryId: true,
          categoryName: true,
          description: true,
          mainCategory: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      console.log(' Category created:', category);

      // Transform response
      const transformedCategory = {
        categoryID: category.categoryId,
        categoryName: category.categoryName,
        description: category.description,
        mainCategory: category.mainCategory,
        isActive: category.isActive,
        createdAt: category.createdAt,
        createdBy: category.createdBy,
        updatedAt: category.updatedAt,
        updatedBy: category.updatedBy,
        deletedAt: category.deletedAt,
        deletedBy: category.deletedBy
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

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create category',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Categories POST error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
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

    let employeeId: number;
    try {
      verifyAccessToken(accessToken)
      employeeId = getEmployeeIdFromToken(accessToken)
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
    const { categoryID, ...updateData } = body

    console.log(' Update - Employee ID from token:', employeeId);

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

    // Validate main category if provided
    if (updateData.mainCategory && !ALLOWED_MAIN_CATEGORIES.includes(updateData.mainCategory)) {
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

    try {
      // Check if category exists
      const existingCategory = await prisma.category.findFirst({
        where: {
          categoryId: parseInt(categoryID),
          deletedAt: null
        }
      })

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
      if (updateData.categoryName) {
        const duplicateCategory = await prisma.category.findFirst({
          where: {
            categoryName: updateData.categoryName,
            categoryId: { not: parseInt(categoryID) },
            deletedAt: null
          }
        })

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

      // Prepare update data
      const prismaUpdateData: any = {
        updatedBy: employeeId
      }

      if (updateData.categoryName !== undefined) prismaUpdateData.categoryName = updateData.categoryName
      if (updateData.description !== undefined) prismaUpdateData.description = updateData.description
      if (updateData.mainCategory !== undefined) prismaUpdateData.mainCategory = updateData.mainCategory || null
      if (updateData.isActive !== undefined) prismaUpdateData.isActive = updateData.isActive

      console.log(' Update data:', prismaUpdateData);

      // Update category
      const category = await prisma.category.update({
        where: {
          categoryId: parseInt(categoryID)
        },
        data: prismaUpdateData,
        select: {
          categoryId: true,
          categoryName: true,
          description: true,
          mainCategory: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      // Transform response
      const transformedCategory = {
        categoryID: category.categoryId,
        categoryName: category.categoryName,
        description: category.description,
        mainCategory: category.mainCategory,
        isActive: category.isActive,
        createdAt: category.createdAt,
        createdBy: category.createdBy,
        updatedAt: category.updatedAt,
        updatedBy: category.updatedBy,
        deletedAt: category.deletedAt,
        deletedBy: category.deletedBy
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

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update category',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Categories PUT error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete category (soft delete)
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

    let employeeId: number;
    try {
      verifyAccessToken(accessToken)
      employeeId = getEmployeeIdFromToken(accessToken)
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
    const categoryID = searchParams.get('categoryID') || searchParams.get('id')

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

    try {
      // Check if category exists
      const existingCategory = await prisma.category.findFirst({
        where: {
          categoryId: parseInt(categoryID),
          deletedAt: null
        }
      })

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

      // Check if category has child categories (assuming mainCategory references categoryName)
      const childCategories = await prisma.category.findFirst({
        where: {
          mainCategory: existingCategory.categoryName,
          deletedAt: null
        }
      })

      if (childCategories) {
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

      // Check if category is being used by any products
      const productsUsingCategory = await prisma.product.findFirst({
        where: {
          categoryId: parseInt(categoryID),
          deletedAt: null
        }
      })

      if (productsUsingCategory) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Cannot delete category that is being used by products',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Soft delete the category
      await prisma.category.update({
        where: {
          categoryId: parseInt(categoryID)
        },
        data: {
          deletedAt: new Date(),
          deletedBy: employeeId,
          isActive: false
        }
      })

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Category deleted successfully',
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete category',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Categories DELETE error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/category:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get all categories
 *     description: Retrieve all categories with pagination, sorting, and search
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: categoryName
 *           enum: [categoryName, description, mainCategory, createdAt, isActive]
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for category name, description, or main category
 *       - in: query
 *         name: mainCategory
 *         schema:
 *           type: string
 *           enum: [Laptop, Desktop, Accessories]
 *         description: Filter by main category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/category:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create a new category
 *     description: Create a new category in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request - Missing required fields or invalid main category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: Category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/category:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update a category
 *     description: Update an existing category in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - type: object
 *                 required:
 *                   - categoryID
 *                 properties:
 *                   categoryID:
 *                     type: integer
 *                     description: Category ID to update
 *               - type: object
 *                 properties:
 *                   categoryName:
 *                     type: string
 *                     description: Category name
 *                   description:
 *                     type: string
 *                     description: Category description
 *                   mainCategory:
 *                     type: string
 *                     enum: [Laptop, Desktop, Accessories]
 *                     description: Main category
 *                   isActive:
 *                     type: boolean
 *                     description: Active status
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request - Missing category ID or invalid main category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: Category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/category:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete a category
 *     description: Delete a category from the system (soft delete)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryID
 *         required: false
 *         schema:
 *           type: integer
 *         description: Category ID to delete
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative category ID parameter
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - Missing category ID or category has child categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */