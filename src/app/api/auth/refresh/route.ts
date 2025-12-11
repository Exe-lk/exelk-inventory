import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt'
import { getRefreshTokenFromCookies, setAuthCookies } from '@/lib/cookies'

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Generate a new access token using the refresh token
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: Sets new httpOnly access token cookie
 *             schema:
 *               type: string
 *               example: "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/; Max-Age=900; SameSite=Strict"
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
 *                   example: "Token refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: New access token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Unauthorized - Refresh token not found or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     not_found:
 *                       value: "Refresh token not found"
 *                     invalid:
 *                       value: "Invalid refresh token"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 */

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

