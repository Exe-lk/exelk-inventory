import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { Employee } from '@/types/user'

/**
 * @swagger
 * /api/employee:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get all employees
 *     description: Retrieve all employees from the system
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch employees"
 *                 details:
 *                   type: string
 */


export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .order('EmployeeID', { ascending: true })

    if (error) {
      console.error('Error fetching employees:', error)
      return NextResponse.json(
        { error: 'Failed to fetch employees', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ employees: employees || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/employee:
 *   post:
 *     tags:
 *       - Employees
 *     summary: Create a new employee
 *     description: Create a new employee in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Email
 *               - UserName
 *               - Password
 *               - RoleID
 *             properties:
 *               Email:
 *                 type: string
 *                 format: email
 *                 description: Employee email address
 *                 example: "john.doe@example.com"
 *               UserName:
 *                 type: string
 *                 description: Username for the employee
 *                 example: "john_doe"
 *               Password:
 *                 type: string
 *                 description: Employee password
 *                 example: "securePassword123"
 *               Phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "+1234567890"
 *               RoleID:
 *                 type: integer
 *                 description: Role ID for the employee
 *                 example: 1
 *               CreatedBy:
 *                 type: integer
 *                 description: ID of the employee who created this record
 *                 example: 1
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employee:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required fields: Email, UserName, Password, RoleID"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create employee"
 *                 details:
 *                   type: string
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    
    // Validate required fields
    const { Email, UserName, Password, RoleID } = body
    if (!Email || !UserName || !Password || !RoleID) {
      return NextResponse.json(
        { error: 'Missing required fields: Email, UserName, Password, RoleID' },
        { status: 400 }
      )
    }

    const employeeData = {
      ...body,
      CreatedDate: new Date().toISOString()
    }
    
    const { data: employee, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single()

    if (error) {
      console.error('Error creating employee:', error)
      return NextResponse.json(
        { error: 'Failed to create employee', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/employee:
 *   put:
 *     tags:
 *       - Employees
 *     summary: Update an employee
 *     description: Update an existing employee in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - EmployeeID
 *             properties:
 *               EmployeeID:
 *                 type: integer
 *                 description: Employee ID to update
 *                 example: 1
 *               Email:
 *                 type: string
 *                 format: email
 *                 description: Employee email address
 *                 example: "john.doe@example.com"
 *               UserName:
 *                 type: string
 *                 description: Username for the employee
 *                 example: "john_doe"
 *               Phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "+1234567890"
 *               RoleID:
 *                 type: integer
 *                 description: Role ID for the employee
 *                 example: 1
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employee:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Bad request - Missing employee ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "EmployeeID is required"
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Employee not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update employee"
 *                 details:
 *                   type: string
 */

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { EmployeeID, ...updateData } = body
    
    if (!EmployeeID) {
      return NextResponse.json(
        { error: 'EmployeeID is required' },
        { status: 400 }
      )
    }
    
    const { data: employee, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('EmployeeID', EmployeeID)
      .select()
      .single()

    if (error) {
      console.error('Error updating employee:', error)
      return NextResponse.json(
        { error: 'Failed to update employee', details: error.message },
        { status: 500 }
      )
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ employee })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/employee:
 *   delete:
 *     tags:
 *       - Employees
 *     summary: Delete an employee
 *     description: Delete an employee from the system
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Employee deleted successfully"
 *       400:
 *         description: Bad request - Missing employee ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Employee ID is required"
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Employee not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete employee"
 *                 details:
 *                   type: string
 */

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('id')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const { data: existingEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('EmployeeID')
      .eq('EmployeeID', employeeId)
      .single()

    if (fetchError || !existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('EmployeeID', employeeId)

    if (error) {
      console.error('Error deleting employee:', error)
      return NextResponse.json(
        { error: 'Failed to delete employee', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}