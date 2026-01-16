import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Employee } from '@/types/user'
import { getAuthenticatedSession } from '@/lib/api-auth-optimized'

/**
 * @swagger
 * /api/employee:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get all employees
 *     description: Retrieve all employees from the system
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
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


export async function GET(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }

    const employees = await prisma.employees.findMany({
      orderBy: { EmployeeID: 'asc' },
      select: {
        EmployeeID: true,
        Email: true,
        UserName: true,
        Phone: true,
        RoleID: true,
        CreatedBy: true,
        CreatedDate: true
      }
    })

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
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export async function POST(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }

    const employeeId = authResult.employeeId

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
      CreatedBy: employeeId,
      CreatedDate: new Date()
    }

    const employee = await prisma.employees.create({
      data: employeeData,
      select: {
        EmployeeID: true,
        Email: true,
        UserName: true,
        Phone: true,
        RoleID: true,
        CreatedBy: true,
        CreatedDate: true
      }
    })

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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
 *     security:
 *       - cookieAuth: []
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
 *       400:
 *         description: Bad request - Missing employee ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }

    const body = await request.json()
    const { EmployeeID, ...updateData } = body

    if (!EmployeeID) {
      return NextResponse.json(
        { error: 'EmployeeID is required' },
        { status: 400 }
      )
    }

    const employee = await prisma.employees.update({
      where: { EmployeeID: parseInt(EmployeeID) },
      data: updateData,
      select: {
        EmployeeID: true,
        Email: true,
        UserName: true,
        Phone: true,
        RoleID: true,
        CreatedBy: true,
        CreatedDate: true
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ employee })
  } catch (error) {
    console.error('Unexpected error:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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
 *     security:
 *       - cookieAuth: []
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
 *       400:
 *         description: Bad request - Missing employee ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication using Supabase
    // Verify authentication using optimized helper
    const authResult = await getAuthenticatedSession(request)
    if (authResult.error) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('id')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const existingEmployee = await prisma.employees.findUnique({
      where: { EmployeeID: parseInt(employeeId) },
      select: { EmployeeID: true }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    await prisma.employees.delete({
      where: { EmployeeID: parseInt(employeeId) }
    })

    return NextResponse.json({ success: true, message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}