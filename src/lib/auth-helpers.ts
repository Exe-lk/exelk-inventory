import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'

export interface AuthUser {
  employeeId: number
  email: string
  username: string
  roleId: number
  role: string
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    // Get employee ID from user metadata
    const employeeId = session.user.user_metadata?.employee_id
    
    if (!employeeId) {
      return null
    }

    // Get employee from database
    const employee = await prisma.employees.findUnique({
      where: { EmployeeID: parseInt(employeeId) },
      select: {
        EmployeeID: true,
        Email: true,
        UserName: true,
        RoleID: true
      }
    })

    if (!employee) {
      return null
    }

    return {
      employeeId: employee.EmployeeID,
      email: employee.Email,
      username: employee.UserName,
      roleId: employee.RoleID,
      role: getRoleName(employee.RoleID)
    }
  } catch (error) {
    console.error('Error getting auth user:', error)
    return null
  }
}

export function getRoleName(roleID: number): string {
  switch (roleID) {
    case 1: return 'superAdmin'
    case 2: return 'admin'
    case 3: return 'stockKeeper'
    default: return 'user'
  }
}