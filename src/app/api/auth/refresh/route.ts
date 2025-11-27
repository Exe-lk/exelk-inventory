import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt'
import { getRefreshTokenFromCookies, setAuthCookies } from '@/lib/cookies'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromCookies(request)

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token not found' },
        { status: 401 }
      )
    }

    // Verify refresh token
    const { userId } = verifyRefreshToken(refreshToken)

    const supabase = createServerClient()

    // Get user from database
    const { data: employee, error } = await supabase
      .from('employees')
      .select('EmployeeID, UserName, Email, RoleID')
      .eq('EmployeeID', userId)
      .single()

    if (error || !employee) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(
      employee.EmployeeID,
      employee.UserName,
      employee.Email,
      employee.RoleID
    )

    const response = NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        data: { accessToken: newAccessToken }
      },
      { status: 200 }
    )

    // Set new access token cookie (keep the same refresh token)
    setAuthCookies(response, newAccessToken, refreshToken)

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { success: false, message: 'Invalid refresh token' },
      { status: 401 }
    )
  }
}

