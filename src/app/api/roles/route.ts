import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Get all roles
 *     description: Retrieve all roles from the system
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       RoleID:
 *                         type: integer
 *                         description: Role ID
 *                         example: 1
 *                       RoleName:
 *                         type: string
 *                         description: Role name
 *                         example: "Admin"
 *                       Description:
 *                         type: string
 *                         description: Role description
 *                         example: "System administrator"
 *                       Permissions:
 *                         type: string
 *                         description: Role permissions
 *                         example: "full_access"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch roles"
 *                 details:
 *                   type: string
 *                   example: "Database connection error"
 */

export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('RoleID', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch roles', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ roles: roles || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}