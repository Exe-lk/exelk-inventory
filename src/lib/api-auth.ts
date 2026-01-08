import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export interface AuthResult {
  employeeId: number
  response?: NextResponse
  error?: boolean
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult> {
  try {
    const supabase = await createServerClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return {
        employeeId: 0,
        error: true,
        response: NextResponse.json(
          {
            status: 'error',
            code: 401,
            message: 'Access token not found',
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        )
      }
    }

    const employeeId = session.user.user_metadata?.employee_id

    if (!employeeId) {
      return {
        employeeId: 0,
        error: true,
        response: NextResponse.json(
          {
            status: 'error',
            code: 401,
            message: 'User metadata not found',
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        )
      }
    }

    return { 
      employeeId: parseInt(employeeId),
      error: false
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      employeeId: 0,
      error: true,
      response: NextResponse.json(
        {
          status: 'error',
          code: 500,
          message: 'Authentication failed',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
}

// Helper to get employee ID from token (for backward compatibility)
export function getEmployeeIdFromToken(accessToken: string): number {
  // This is now handled by Supabase session
  // Keep for backward compatibility but will be replaced
  return 0
}