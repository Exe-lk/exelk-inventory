import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/cookies'
import { createServerClient } from '@/lib/supabase/server'

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: Logout the user by clearing authentication cookies
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         headers:
 *           Set-Cookie:
 *             description: Clears authentication cookies
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: 
 *                 - "accessToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
 *                 - "refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
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
 *                   example: "Logged out successfully"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */

// export async function POST(request: NextRequest) {
//   try {
//     const response = NextResponse.json(
//       { success: true, message: 'Logged out successfully' },
//       { status: 200 }
//     )

//     // Clear auth cookies
//     clearAuthCookies(response)

//     return response

//   } catch (error) {
//     console.error('Logout error:', error)
//     return NextResponse.json(
//       { success: false, message: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }


export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Sign out from Supabase
    await supabase.auth.signOut()

    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
