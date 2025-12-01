import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

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

// GET - Retrieve models with pagination, sorting, search, and filtering
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
    const sortBy = searchParams.get('sortBy') || 'modelName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const brandId = searchParams.get('brandId')
    const isActive = searchParams.get('isActive')

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with camelCase column names
    let query = supabase
      .from('model')
      .select(`
        modelId,
        modelName,
        description,
        brandId,
        isActive,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy,
        deletedAt,
        deletedBy
      `, { count: 'exact' })

    // Apply search filter with camelCase column names
    if (search) {
      query = query.or(`modelName.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply filters with camelCase column names
    if (brandId) {
      query = query.eq('brandId', parseInt(brandId))
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('isActive', isActive === 'true')
    }

    // Apply sorting with camelCase column names
    const validSortColumns = ['modelName', 'description', 'brandId', 'isActive', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'modelName'
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    console.log('Executing model query...')
    const { data: models, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve models from database',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log('Models fetched:', models?.length)
    console.log('Sample model:', models?.[0])

    // Transform data to match frontend expectations
    const transformedModels = models?.map(model => ({
      modelID: model.modelId,
      modelName: model.modelName,
      description: model.description || '',
      brandID: model.brandId,
      isActive: model.isActive,
      createdAt: model.createdAt,
      createdBy: model.createdBy || 1,
      updatedAt: model.updatedAt || model.createdAt,
      updatedBy: model.updatedBy || 1,
      deletedAt: model.deletedAt,
      deletedBy: model.deletedBy
    })) || []

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Models retrieved successfully',
        timestamp: new Date().toISOString(),
        data: {
          items: transformedModels,
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
    console.error('Models GET error:', error)
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

// POST - Create new model
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
    const employeeId = getEmployeeIdFromToken(accessToken)

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

    const body = await request.json()
    const { modelName, description, brandID, isActive = true } = body

    console.log('Received model data:', { modelName, description, brandID, isActive })
    console.log('Employee ID from token:', employeeId)

    // Validate required fields
    if (!modelName) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Model name is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    if (!brandID) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Brand ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if brand exists
    const { data: brand, error: brandError } = await supabase
      .from('brand')
      .select('brandId')
      .eq('brandId', brandID)
      .maybeSingle()

    if (brandError) {
      console.error('Error checking brand:', brandError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to validate brand',
          error: brandError.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    if (!brand) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid Brand ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check if model name already exists for the same brand
    const { data: existingModel, error: checkError } = await supabase
      .from('model')
      .select('modelId')
      .eq('modelName', modelName)
      .eq('brandId', brandID)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing model:', checkError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to check existing model',
          error: checkError.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    if (existingModel) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 409,
          message: 'Model name already exists for this brand',
          timestamp: new Date().toISOString()
        },
        { status: 409 }
      )
    }

    // Prepare insert data with employee ID from auth token
    const currentTimestamp = new Date().toISOString()
    const insertData = {
      modelName: modelName,
      description: description || '',
      brandId: brandID,
      isActive: isActive,
      createdAt: currentTimestamp,
      createdBy: employeeId, // Use employee ID from auth token
      updatedAt: currentTimestamp,
      updatedBy: employeeId  // Use employee ID from auth token
    }

    console.log('Insert model data:', insertData)

    // Create new model
    const { data: newModel, error } = await supabase
      .from('model')
      .insert([insertData])
      .select(`
        modelId,
        modelName,
        description,
        brandId,
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
          message: 'Failed to create model',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log('Created model:', newModel)

    // Transform response
    const transformedModel = {
      modelID: newModel.modelId,
      modelName: newModel.modelName,
      description: newModel.description,
      brandID: newModel.brandId,
      isActive: newModel.isActive,
      createdAt: newModel.createdAt,
      createdBy: newModel.createdBy,
      updatedAt: newModel.updatedAt,
      updatedBy: newModel.updatedBy
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 201,
        message: 'Model created successfully',
        timestamp: new Date().toISOString(),
        data: transformedModel
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Models POST error:', error)
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

// PUT - Update model
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
    const employeeId = getEmployeeIdFromToken(accessToken)

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

    const body = await request.json()
    const { modelID, modelName, description, brandID, isActive } = body

    console.log('Employee ID from token for update:', employeeId)

    // Validate required fields
    if (!modelID) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Model ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if model exists
    const { data: existingModel } = await supabase
      .from('model')
      .select('modelId')
      .eq('modelId', modelID)
      .single()

    if (!existingModel) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Model not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // If brandID is being updated, check if it exists
    if (brandID) {
      const { data: brand, error: brandError } = await supabase
        .from('brand')
        .select('brandId')
        .eq('brandId', brandID)
        .maybeSingle()

      if (brandError || !brand) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid Brand ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Check if model name already exists for the same brand (excluding current model)
    if (modelName || brandID) {
      const { data: currentModel } = await supabase
        .from('model')
        .select('modelName, brandId')
        .eq('modelId', modelID)
        .single()

      if (currentModel) {
        const modelNameToCheck = modelName || currentModel.modelName
        const brandIDToCheck = brandID || currentModel.brandId

        const { data: duplicateModel } = await supabase
          .from('model')
          .select('modelId')
          .eq('modelName', modelNameToCheck)
          .eq('brandId', brandIDToCheck)
          .neq('modelId', modelID)
          .maybeSingle()

        if (duplicateModel) {
          return NextResponse.json(
            { 
              status: 'error',
              code: 409,
              message: 'Model name already exists for this brand',
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          )
        }
      }
    }

    // Prepare update data with employee ID from auth token
    const updateData: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: employeeId // Use employee ID from auth token
    }
    if (modelName !== undefined) updateData.modelName = modelName
    if (description !== undefined) updateData.description = description
    if (brandID !== undefined) updateData.brandId = brandID
    if (isActive !== undefined) updateData.isActive = isActive

    console.log('Update data with employee ID:', updateData)

    // Update model
    const { data: updatedModel, error } = await supabase
      .from('model')
      .update(updateData)
      .eq('modelId', modelID)
      .select(`
        modelId,
        modelName,
        description,
        brandId,
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
          message: 'Failed to update model',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Transform response
    const transformedModel = {
      modelID: updatedModel.modelId,
      modelName: updatedModel.modelName,
      description: updatedModel.description,
      brandID: updatedModel.brandId,
      isActive: updatedModel.isActive,
      createdAt: updatedModel.createdAt,
      createdBy: updatedModel.createdBy,
      updatedAt: updatedModel.updatedAt,
      updatedBy: updatedModel.updatedBy
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Model updated successfully',
        timestamp: new Date().toISOString(),
        data: transformedModel
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Models PUT error:', error)
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

// DELETE - Delete model
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
    const modelID = searchParams.get('modelID') || searchParams.get('id')

    if (!modelID) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Model ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if model exists
    const { data: existingModel } = await supabase
      .from('model')
      .select('modelId')
      .eq('modelId', parseInt(modelID))
      .single()

    if (!existingModel) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Model not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Optional: Check if model is being used by any products
    const { data: productsUsingModel } = await supabase
      .from('product')
      .select('productId')
      .eq('modelId', parseInt(modelID))
      .limit(1)

    if (productsUsingModel && productsUsingModel.length > 0) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Cannot delete model that is being used by products',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Delete model
    const { error } = await supabase
      .from('model')
      .delete()
      .eq('modelId', parseInt(modelID))

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete model',
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
        message: 'Model deleted successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Models DELETE error:', error)
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