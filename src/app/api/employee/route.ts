import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { Employee } from '@/types/user'

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