import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'
import { prisma } from '@/lib/prisma/client'
import { getRoleName } from '@/lib/auth-helpers'

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user information
 *     description: Retrieve information about the currently authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         EmployeeID:
 *                           type: integer
 *                           description: Employee ID
 *                           example: 1
 *                         Email:
 *                           type: string
 *                           format: email
 *                           description: User email
 *                           example: "user@example.com"
 *                         Phone:
 *                           type: string
 *                           description: Phone number
 *                           example: "+1234567890"
 *                         UserName:
 *                           type: string
 *                           description: Username
 *                           example: "john_doe"
 *                         RoleID:
 *                           type: integer
 *                           description: Role ID
 *                           example: 1
 *                         CreatedBy:
 *                           type: integer
 *                           description: Created by employee ID
 *                           example: 1
 *                         CreatedDate:
 *                           type: string
 *                           format: date-time
 *                           description: Creation date
 *                           example: "2023-12-09T10:30:00Z"
 *                     role:
 *                       type: string
 *                       description: User role
 *                       example: "admin"
 *       401:
 *         description: Unauthorized - Access token not found or invalid
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
 *                   example: "Access token not found"
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

// export async function GET(request: NextRequest) {
//   try {
//     const accessToken = getAuthTokenFromCookies(request)

//     if (!accessToken) {
//       return NextResponse.json(
//         { success: false, message: 'Access token not found' },
//         { status: 401 }
//       )
//     }

//     // Verify access token
//     const payload = verifyAccessToken(accessToken)

//     const supabase = createServerClient()

//     // Get user from database
//     const { data: employee, error } = await supabase
//       .from('employees')
//       .select('EmployeeID, Email, Phone, UserName, RoleID, CreatedBy, CreatedDate')
//       .eq('EmployeeID', payload.userId)
//       .single()

//     if (error || !employee) {
//       return NextResponse.json(
//         { success: false, message: 'User not found' },
//         { status: 404 }
//       )
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         data: {
//           user: employee,
//           role: payload.role
//         }
//       },
//       { status: 200 }
//     )

//   } catch (error) {
//     console.error('Get current user error:', error)
//     return NextResponse.json(
//       { success: false, message: 'Invalid or expired token' },
//       { status: 401 }
//     )
//   }
// }



export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Access token not found' },
        { status: 401 }
      )
    }

    // Get employee ID from session metadata
    const employeeId = session.user.user_metadata?.employee_id

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'User metadata not found' },
        { status: 401 }
      )
    }

    // Get employee from database using Prisma
    const employee = await prisma.employees.findUnique({
      where: { EmployeeID: parseInt(employeeId) },
      select: {
        EmployeeID: true,
        Email: true,
        Phone: true,
        UserName: true,
        RoleID: true,
        CreatedBy: true,
        CreatedDate: true
      }
    })

    if (!employee) {
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
          role: getRoleName(employee.RoleID)
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