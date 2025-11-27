import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

export async function GET(request: NextRequest) {
  try {
    const accessToken = getAuthTokenFromCookies(request)

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Access token not found' },
        { status: 401 }
      )
    }

    // Verify access token
    const payload = verifyAccessToken(accessToken)

    const supabase = createServerClient()

    // Get user from database
    const { data: employee, error } = await supabase
      .from('employees')
      .select('EmployeeID, Email, Phone, UserName, RoleID, CreatedBy, CreatedDate')
      .eq('EmployeeID', payload.userId)
      .single()

    if (error || !employee) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: employee,
          role: payload.role
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { success: false, message: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

