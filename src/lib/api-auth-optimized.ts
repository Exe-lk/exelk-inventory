import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Cache session for short duration (in-memory, per request)
let cachedSession: { session: any; timestamp: number } | null = null
const CACHE_TTL = 1000 // 1 second cache

export async function getAuthenticatedSession(request: NextRequest) {
  // OPTIMIZATION: Use request headers to check if we can reuse session
  const authHeader = request.headers.get('authorization')
  
  // Create client once per request
  const supabase = await createServerClient()
  
  // OPTIMIZATION: Use getUser() instead of getSession() - faster
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
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

  const employeeId = user.user_metadata?.employee_id
  if (!employeeId) {
    return {
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
    error: false,
    employeeId: parseInt(employeeId.toString()),
    user
  }
}