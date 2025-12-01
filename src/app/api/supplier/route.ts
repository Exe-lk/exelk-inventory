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

// GET - Retrieve suppliers with pagination, sorting, search, and filtering
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
    const sortBy = searchParams.get('sortBy') || 'supplierName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const isActive = searchParams.get('isActive')

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query - select only non-deleted records
    let query = supabase
      .from('supplier')
      .select(`
        supplierId,
        supplierName,
        contactPerson,
        email,
        phone,
        address,
        city,
        country,
        isActive,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy
      `, { count: 'exact' })
      .is('deletedAt', null) // Only get non-deleted suppliers

    // Apply search filter
    if (search) {
      query = query.or(`supplierName.ilike.%${search}%,contactPerson.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply filters
    if (city) {
      query = query.eq('city', city)
    }

    if (country) {
      query = query.eq('country', country)
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('isActive', isActive === 'true')
    }

    // Apply sorting
    const dbSortBy = sortBy === 'supplierName' ? 'supplierName' : 
                     sortBy === 'supplierId' ? 'supplierId' :
                     sortBy === 'contactPerson' ? 'contactPerson' :
                     sortBy === 'email' ? 'email' :
                     sortBy === 'city' ? 'city' :
                     sortBy === 'country' ? 'country' :
                     sortBy === 'isActive' ? 'isActive' :
                     sortBy === 'createdAt' ? 'createdAt' : 'supplierName'

    query = query.order(dbSortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: suppliers, error, count } = await query

    if (error) {
      console.error('Error fetching suppliers:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve suppliers',
          timestamp: new Date().toISOString(),
          details: error.message
        },
        { status: 500 }
      )
    }

    // Transform data to match response format
    const transformedSuppliers = suppliers?.map(supplier => ({
      supplierID: supplier.supplierId,
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      isActive: supplier.isActive,
      createdDate: supplier.createdAt,
      updatedDate: supplier.updatedAt
    })) || []

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Suppliers retrieved successfully',
        timestamp: new Date().toISOString(),
        data: {
          items: transformedSuppliers,
          pagination: {
            totalItems: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
          },
          sorting: {
            sortBy,
            sortOrder
          },
          search: search || null,
          filters: {
            city: city || null,
            country: country || null,
            isActive: isActive || null
          }
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Suppliers GET error:', error)
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

// POST - Create new supplier
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

    let loggedInEmployeeId: number;
    try {
      verifyAccessToken(accessToken)
      loggedInEmployeeId = getEmployeeIdFromToken(accessToken)
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
    const body = await request.json()
    
    // Validate required fields
    const { supplierName, contactPerson, email, phone } = body
    if (!supplierName || !contactPerson || !email || !phone) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Supplier name, contact person, email, and phone are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check if supplier with same email already exists (only non-deleted)
    const { data: existingSupplier, error: checkError } = await supabase
      .from('supplier')
      .select('supplierId')
      .eq('email', email)
      .is('deletedAt', null)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing supplier:', checkError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to check existing supplier',
          error: checkError.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    if (existingSupplier) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 409,
          message: 'Supplier with this email already exists',
          timestamp: new Date().toISOString()
        },
        { status: 409 }
      )
    }

    // Prepare supplier data with logged-in employee ID
    const currentTimestamp = new Date().toISOString();
    const supplierData = {
      supplierName,
      contactPerson,
      email,
      phone,
      address: body.address || '',
      city: body.city || '',
      country: body.country || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: currentTimestamp,
      createdBy: loggedInEmployeeId, // Using logged-in employee ID
      updatedAt: currentTimestamp,
      updatedBy: loggedInEmployeeId  // Using logged-in employee ID
    }
    
    const { data: supplier, error } = await supabase
      .from('supplier')
      .insert([supplierData])
      .select(`
        supplierId,
        supplierName,
        contactPerson,
        email,
        phone,
        address,
        city,
        country,
        isActive,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy
      `)
      .single()

    if (error) {
      console.error('Error creating supplier:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create supplier',
          timestamp: new Date().toISOString(),
          details: error.message
        },
        { status: 500 }
      )
    }

    // Transform response
    const transformedSupplier = {
      supplierID: supplier.supplierId,
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      isActive: supplier.isActive,
      createdDate: supplier.createdAt,
      updatedDate: supplier.updatedAt
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 201,
        message: 'Supplier created successfully',
        timestamp: new Date().toISOString(),
        data: transformedSupplier
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Suppliers POST error:', error)
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

// PUT - Update supplier
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

    let loggedInEmployeeId: number;
    try {
      verifyAccessToken(accessToken)
      loggedInEmployeeId = getEmployeeIdFromToken(accessToken)
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
    const body = await request.json()
    const { supplierId, ...updateData } = body
    
    if (!supplierId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Supplier ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check if supplier exists and is not deleted
    const { data: existingSupplierCheck, error: existsError } = await supabase
      .from('supplier')
      .select('supplierId')
      .eq('supplierId', supplierId)
      .is('deletedAt', null)
      .maybeSingle()

    if (existsError) {
      console.error('Error checking supplier existence:', existsError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to check supplier existence',
          error: existsError.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    if (!existingSupplierCheck) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Supplier not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Check if email already exists (excluding current supplier and deleted ones)
    if (updateData.email) {
      const { data: duplicateSupplier } = await supabase
        .from('supplier')
        .select('supplierId')
        .eq('email', updateData.email)
        .neq('supplierId', supplierId)
        .is('deletedAt', null)
        .maybeSingle()

      if (duplicateSupplier) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'Supplier with this email already exists',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }
    }

    // Add update timestamp and logged-in employee ID
    const updateDataWithTimestamp = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: loggedInEmployeeId // Using logged-in employee ID
    }
    
    const { data: supplier, error } = await supabase
      .from('supplier')
      .update(updateDataWithTimestamp)
      .eq('supplierId', supplierId)
      .select(`
        supplierId,
        supplierName,
        contactPerson,
        email,
        phone,
        address,
        city,
        country,
        isActive,
        createdAt,
        createdBy,
        updatedAt,
        updatedBy
      `)
      .single()

    if (error) {
      console.error('Error updating supplier:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update supplier',
          timestamp: new Date().toISOString(),
          details: error.message
        },
        { status: 500 }
      )
    }

    if (!supplier) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Supplier not found after update',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Transform response
    const transformedSupplier = {
      supplierID: supplier.supplierId,
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      isActive: supplier.isActive,
      createdDate: supplier.createdAt,
      updatedDate: supplier.updatedAt
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Supplier updated successfully',
        timestamp: new Date().toISOString(),
        data: transformedSupplier
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Suppliers PUT error:', error)
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

// DELETE - Delete supplier (soft delete)
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

    let loggedInEmployeeId: number;
    try {
      verifyAccessToken(accessToken)
      loggedInEmployeeId = getEmployeeIdFromToken(accessToken)
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
    const supplierId = searchParams.get('supplierId') || searchParams.get('supplierID') || searchParams.get('id')

    if (!supplierId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Supplier ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if supplier exists and is not already deleted
    const { data: existingSupplier, error: fetchError } = await supabase
      .from('supplier')
      .select('supplierId')
      .eq('supplierId', supplierId)
      .is('deletedAt', null)
      .maybeSingle()

    if (fetchError) {
      console.error('Error checking existing supplier:', fetchError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to check supplier existence',
          error: fetchError.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    if (!existingSupplier) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Supplier not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Optional: Check if supplier is being used by any products
    const { data: productsUsingSupplier } = await supabase
      .from('product')
      .select('productId')
      .eq('supplierId', supplierId)
      .limit(1)

    if (productsUsingSupplier && productsUsingSupplier.length > 0) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Cannot delete supplier that is being used by products',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    // Soft delete the supplier with logged-in employee ID
    const { error } = await supabase
      .from('supplier')
      .update({
        deletedAt: new Date().toISOString(),
        deletedBy: loggedInEmployeeId, // Using logged-in employee ID
        isActive: false
      })
      .eq('supplierId', supplierId)

    if (error) {
      console.error('Error deleting supplier:', error)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to delete supplier',
          timestamp: new Date().toISOString(),
          details: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Supplier deleted successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Suppliers DELETE error:', error)
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