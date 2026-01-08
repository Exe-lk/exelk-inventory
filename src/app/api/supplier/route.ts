
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'

interface Supplier {
  supplierId: number
  supplierName: string
  contactPerson: string
  email: string
  phone: string
  address: string | null
  city: string | null
  country: string | null
  isActive: boolean
  createdAt: Date
  createdBy: number
  updatedAt: Date
  updatedBy: number
  deletedAt: Date | null
  deletedBy: number | null
}

// Helper function to extract employee ID from Supabase session
async function getEmployeeIdFromSession(request: NextRequest): Promise<number | null> {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }
    
    const employeeId = session.user.user_metadata?.employee_id
    return employeeId ? parseInt(employeeId.toString()) : null
  } catch (error) {
    console.error('Error extracting employee ID from session:', error)
    return null
  }
}

// GET - Retrieve suppliers with pagination, sorting, search, and filtering
export async function GET(request: NextRequest) {
  console.log(' Supplier GET request started');
  
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log(' No valid session found');
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

    console.log(' Session verified');

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const sortBy = searchParams.get('sortBy') || 'supplierId'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const isActive = searchParams.get('isActive')

    console.log(' Query parameters:', { page, limit, sortBy, sortOrder, search, city, country, isActive });

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null // Only get non-deleted suppliers
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { supplierName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Apply filters
    if (city) {
      where.city = city
    }

    if (country) {
      where.country = country
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Build orderBy
    const orderBy: any = {}
    const validSortColumns = ['supplierName', 'supplierId', 'contactPerson', 'email', 'city', 'country', 'isActive', 'createdAt']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'supplierName'
    orderBy[sortColumn] = sortOrder === 'asc' ? 'asc' : 'desc'

    console.log(' Where clause:', JSON.stringify(where, null, 2));
    console.log(' Order by:', orderBy);

    try {
      console.log(' Testing database connection...');
      await prisma.$connect();
      console.log(' Database connected successfully');

      // Get total count for pagination
      console.log(' Getting total count...');
      const totalCount = await prisma.supplier.count({ where });
      console.log(` Total count: ${totalCount}`);

      // Get suppliers with pagination
      console.log(' Fetching suppliers...');
      const suppliers: Supplier[] = await prisma.supplier.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          supplierId: true,
          supplierName: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      }) as Supplier[];

      console.log(` Found ${suppliers.length} suppliers`);

      // Transform data to match response format
      const transformedSuppliers = suppliers.map((supplier: any) => ({
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
      }));

      console.log(' Suppliers transformed successfully');

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Suppliers retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            items: transformedSuppliers,
            pagination: {
              totalItems: totalCount,
              page,
              limit,
              totalPages: Math.ceil(totalCount / limit)
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
          message: 'Failed to retrieve suppliers - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Suppliers GET error:', error);
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

// POST - Create new supplier
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
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

    const employeeId = await getEmployeeIdFromSession(request)
    
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid session - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const { supplierName, contactPerson, email, phone } = body
    
    console.log(' Received data:', { supplierName, contactPerson, email, phone });
    console.log(' Employee ID from session:', employeeId);

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

    try {
      // Check if supplier with same email already exists (only non-deleted)
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          email,
          deletedAt: null
        }
      })

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

      // Create new supplier
      const supplier = await prisma.supplier.create({
        data: {
          supplierName,
          contactPerson,
          email,
          phone,
          address: body.address || '',
          city: body.city || '',
          country: body.country || '',
          isActive: body.isActive !== undefined ? body.isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        },
        select: {
          supplierId: true,
          supplierName: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        }
      })

      console.log(' Supplier created:', supplier);

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

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create supplier',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Suppliers POST error:', error)
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
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
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

    const employeeId = await getEmployeeIdFromSession(request)
    
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid session - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { supplierId, ...updateData } = body

    console.log(' Update - Employee ID from session:', employeeId);
    
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

    try {
      // Check if supplier exists and is not deleted
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          supplierId: parseInt(supplierId),
          deletedAt: null
        }
      })

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

      // Check if email already exists (excluding current supplier and deleted ones)
      if (updateData.email) {
        const duplicateSupplier = await prisma.supplier.findFirst({
          where: {
            email: updateData.email,
            supplierId: { not: parseInt(supplierId) },
            deletedAt: null
          }
        })

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

      // Prepare update data
      const prismaUpdateData: any = {
        updatedBy: employeeId
      }

      if (updateData.supplierName !== undefined) prismaUpdateData.supplierName = updateData.supplierName
      if (updateData.contactPerson !== undefined) prismaUpdateData.contactPerson = updateData.contactPerson
      if (updateData.email !== undefined) prismaUpdateData.email = updateData.email
      if (updateData.phone !== undefined) prismaUpdateData.phone = updateData.phone
      if (updateData.address !== undefined) prismaUpdateData.address = updateData.address
      if (updateData.city !== undefined) prismaUpdateData.city = updateData.city
      if (updateData.country !== undefined) prismaUpdateData.country = updateData.country
      if (updateData.isActive !== undefined) prismaUpdateData.isActive = updateData.isActive

      console.log(' Update data:', prismaUpdateData);

      // Update supplier
      const supplier = await prisma.supplier.update({
        where: {
          supplierId: parseInt(supplierId)
        },
        data: prismaUpdateData,
        select: {
          supplierId: true,
          supplierName: true,
          contactPerson: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
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

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to update supplier',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Suppliers PUT error:', error)
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
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
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

    const employeeId = await getEmployeeIdFromSession(request)
    
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid session - employee ID not found',
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

    try {
      // Check if supplier exists and is not already deleted
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          supplierId: parseInt(supplierId),
          deletedAt: null
        }
      })

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

      // Check if supplier is being used by any products
      const productsUsingSupplier = await prisma.product.findFirst({
        where: {
          supplierId: parseInt(supplierId),
          deletedAt: null
        }
      })

      if (productsUsingSupplier) {
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

      // Soft delete the supplier
      await prisma.supplier.update({
        where: {
          supplierId: parseInt(supplierId)
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
          message: 'Supplier deleted successfully',
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
          message: 'Failed to delete supplier',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Suppliers DELETE error:', error)
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

// ... existing swagger documentation ...







/**
 * @swagger
 * /api/supplier:
 *   get:
 *     tags:
 *       - Suppliers
 *     summary: Get all suppliers
 *     description: Retrieve all suppliers with pagination, sorting, search, and filtering
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
 *           default: supplierName
 *           enum: [supplierName, supplierId, contactPerson, email, city, country, isActive, createdAt]
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
 *         description: Search term for supplier name, contact person, or email
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
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
 *                             $ref: '#/components/schemas/Supplier'
 *                         sorting:
 *                           type: object
 *                           properties:
 *                             sortBy:
 *                               type: string
 *                             sortOrder:
 *                               type: string
 *                         search:
 *                           type: string
 *                           nullable: true
 *                         filters:
 *                           type: object
 *                           properties:
 *                             city:
 *                               type: string
 *                               nullable: true
 *                             country:
 *                               type: string
 *                               nullable: true
 *                             isActive:
 *                               type: string
 *                               nullable: true
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
 * /api/supplier:
 *   post:
 *     tags:
 *       - Suppliers
 *     summary: Create a new supplier
 *     description: Create a new supplier in the system
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSupplierRequest'
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Bad request - Missing required fields
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
 *         description: Supplier with this email already exists
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
 * /api/supplier:
 *   put:
 *     tags:
 *       - Suppliers
 *     summary: Update a supplier
 *     description: Update an existing supplier in the system
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
 *                   - supplierId
 *                 properties:
 *                   supplierId:
 *                     type: integer
 *                     description: Supplier ID to update
 *               - type: object
 *                 properties:
 *                   supplierName:
 *                     type: string
 *                     description: Supplier name
 *                   contactPerson:
 *                     type: string
 *                     description: Contact person
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Email address
 *                   phone:
 *                     type: string
 *                     description: Phone number
 *                   address:
 *                     type: string
 *                     description: Address
 *                   city:
 *                     type: string
 *                     description: City
 *                   country:
 *                     type: string
 *                     description: Country
 *                   isActive:
 *                     type: boolean
 *                     description: Active status
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Bad request - Missing supplier ID
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
 *         description: Supplier not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: Supplier with this email already exists
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
 * /api/supplier:
 *   delete:
 *     tags:
 *       - Suppliers
 *     summary: Delete a supplier
 *     description: Soft delete a supplier from the system
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: supplierId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Supplier ID to delete
 *       - in: query
 *         name: supplierID
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative supplier ID parameter
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alternative ID parameter
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - Missing supplier ID or supplier in use by products
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
 *         description: Supplier not found
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