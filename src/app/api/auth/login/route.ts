
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { LoginRequest, LoginResponse } from '@/types/user'
import { prisma } from '@/lib/prisma/client'
import { verifyPassword } from '@/lib/password'
import { getRoleName } from '@/lib/auth-helpers'

// Add this to src/app/api/auth/login/route.ts

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user and return access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *         headers:
 *           Set-Cookie:
 *             description: Sets httpOnly cookies for accessToken and refreshToken
 *             schema:
 *               type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing username or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */









// export async function POST(request: NextRequest) {
//   try {
//     const body: LoginRequest = await request.json()
//     const { username, password } = body

//     if (!username || !password) {
//       return NextResponse.json(
//         { success: false, message: 'Username and password are required' },
//         { status: 400 }
//       )
//     }

//     // Get employee from database using Prisma
//     const employee = await prisma.employees.findUnique({
//       where: { UserName: username }
//     })

//     if (!employee) {
//       return NextResponse.json(
//         { success: false, message: 'Invalid username or password' },
//         { status: 401 }
//       )
//     }

//     // Verify password
//     const isPasswordValid = password === employee.Password

//     if (!isPasswordValid) {
//       return NextResponse.json(
//         { success: false, message: 'Invalid username or password' },
//         { status: 401 }
//       )
//     }

//     // Create Supabase client
//     const supabase = await createServerClient()

//     // Try to sign in first (user might already exist)
//     const signInResult = await supabase.auth.signInWithPassword({
//       email: employee.Email,
//       password: password
//     })

//     // If sign-in fails, create user using admin client
//     if (signInResult.error || !signInResult.data?.session) {
//       console.log('Sign-in failed, creating user in Supabase Auth...')
      
//       try {
//         const adminClient = createAdminClient()
        
//         // Create user with email confirmation bypassed
//         const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
//           email: employee.Email,
//           password: password,
//           email_confirm: true,
//           user_metadata: {
//             employee_id: employee.EmployeeID,
//             username: employee.UserName,
//             role_id: employee.RoleID
//           }
//         })

//         if (createError) {
//           // If user exists, try to update and sign in again
//           if (createError.code === 'email_exists') {
//             // Update password via admin
//             const { data: usersList } = await adminClient.auth.admin.listUsers()
//             const existingUser = usersList?.users.find(u => u.email === employee.Email)
            
//             if (existingUser) {
//               await adminClient.auth.admin.updateUserById(existingUser.id, {
//                 password: password,
//                 user_metadata: {
//                   employee_id: employee.EmployeeID,
//                   username: employee.UserName,
//                   role_id: employee.RoleID
//                 }
//               })
              
//               // Retry sign-in
//               const retryResult = await supabase.auth.signInWithPassword({
//                 email: employee.Email,
//                 password: password
//               })
              
//               if (!retryResult.data?.session) {
//                 throw new Error('Failed to sign in after user update')
//               }
              
//               signInResult.data = retryResult.data
//               signInResult.error = null
//             } else {
//               throw new Error('User exists but not found in list')
//             }
//           } else {
//             throw createError
//           }
//         } else if (newUser?.user) {
//           // User created, sign in
//           const newSignInResult = await supabase.auth.signInWithPassword({
//             email: employee.Email,
//             password: password
//           })
          
//           if (!newSignInResult.data?.session) {
//             return NextResponse.json(
//               { success: false, message: 'User created but sign-in failed. Please try again.' },
//               { status: 500 }
//             )
//           }
          
//           signInResult.data = newSignInResult.data
//           signInResult.error = null
//         }
//       } catch (adminError: any) {
//         console.error('Error with admin operations:', adminError)
//         return NextResponse.json(
//           { success: false, message: 'Failed to create authentication session' },
//           { status: 500 }
//         )
//       }
//     }

//     // Check if we have a session now
//     if (!signInResult.data?.session) {
//       return NextResponse.json(
//         { success: false, message: 'Failed to create authentication session' },
//         { status: 500 }
//       )
//     }

//     // Build response and set session
//     const response = NextResponse.json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         userId: employee.EmployeeID,
//         username: employee.UserName,
//         role: getRoleName(employee.RoleID),
//         accessToken: signInResult.data.session.access_token,
//         refreshToken: signInResult.data.session.refresh_token
//       }
//     }, { status: 200 })

//     // Set session - this automatically sets cookies via SSR
//     await supabase.auth.setSession({
//       access_token: signInResult.data.session.access_token,
//       refresh_token: signInResult.data.session.refresh_token
//     })

//     return response

//   } catch (error) {
//     console.error('Login error:', error)
//     return NextResponse.json(
//       { success: false, message: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }













// ... existing imports ...

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Get employee from database using Prisma
    const employee = await prisma.employees.findUnique({
      where: { UserName: username }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = password === employee.Password

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Try to sign in first (user might already exist)
    const signInResult = await supabase.auth.signInWithPassword({
      email: employee.Email,
      password: password
    })

    // If sign-in fails, create user using admin client
    if (signInResult.error || !signInResult.data?.session) {
      console.log('Sign-in failed, attempting to create/update user in Supabase Auth...')
      
      try {
        // Check if SUPABASE_SERVICE_ROLE_KEY is configured
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
          return NextResponse.json(
            { 
              success: false, 
              message: 'Server configuration error. Please contact administrator.' 
            },
            { status: 500 }
          )
        }

        const adminClient = createAdminClient()
        
        // Check if user exists by email
        let existingUser = null
        try {
          const { data: usersList, error: listError } = await adminClient.auth.admin.listUsers()
          if (!listError && usersList?.users) {
            existingUser = usersList.users.find(u => u.email === employee.Email)
          }
        } catch (listError) {
          console.warn('Could not list users, will attempt create:', listError)
        }

        if (existingUser) {
          // User exists, update password and metadata
          const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
            password: password,
            user_metadata: {
              employee_id: employee.EmployeeID,
              username: employee.UserName,
              role_id: employee.RoleID
            }
          })

          if (updateError) {
            console.error('Error updating user:', updateError)
            return NextResponse.json(
              { 
                success: false, 
                message: 'Failed to update user account. Please contact administrator.' 
              },
              { status: 500 }
            )
          }

          // Retry sign-in after update
          const retryResult = await supabase.auth.signInWithPassword({
            email: employee.Email,
            password: password
          })
          
          if (retryResult.error || !retryResult.data?.session) {
            console.error('Sign-in failed after update:', retryResult.error)
            return NextResponse.json(
              { 
                success: false, 
                message: 'Failed to sign in after account update. Please try again.' 
              },
              { status: 500 }
            )
          }
          
          signInResult.data = retryResult.data
          signInResult.error = null
        } else {
          // User doesn't exist, create new user
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: employee.Email,
            password: password,
            email_confirm: true,
            user_metadata: {
              employee_id: employee.EmployeeID,
              username: employee.UserName,
              role_id: employee.RoleID
            }
          })

          if (createError) {
            console.error('Error creating user:', createError)
            
            // Provide more specific error messages
            if (createError.message?.includes('already registered')) {
              // User exists but wasn't found in list, try sign-in again
              const retrySignIn = await supabase.auth.signInWithPassword({
                email: employee.Email,
                password: password
              })
              
              if (retrySignIn.data?.session) {
                signInResult.data = retrySignIn.data
                signInResult.error = null
              } else {
                return NextResponse.json(
                  { 
                    success: false, 
                    message: 'Account exists but sign-in failed. Please contact administrator.' 
                  },
                  { status: 500 }
                )
              }
            } else {
              return NextResponse.json(
                { 
                  success: false, 
                  message: 'Failed to create user account. Please contact administrator.' 
                },
                { status: 500 }
              )
            }
          } else if (newUser?.user) {
            // User created, sign in
            const newSignInResult = await supabase.auth.signInWithPassword({
              email: employee.Email,
              password: password
            })
            
            if (newSignInResult.error || !newSignInResult.data?.session) {
              console.error('Sign-in failed after user creation:', newSignInResult.error)
              return NextResponse.json(
                { 
                  success: false, 
                  message: 'User created but sign-in failed. Please try again.' 
                },
                { status: 500 }
              )
            }
            
            signInResult.data = newSignInResult.data
            signInResult.error = null
          }
        }
      } catch (adminError: any) {
        console.error('Error with admin operations:', adminError)
        
        // Provide user-friendly error message
        const errorMessage = adminError?.message || 'Unknown error'
        return NextResponse.json(
          { 
            success: false, 
            message: `Authentication configuration error: ${errorMessage}. Please contact administrator.` 
          },
          { status: 500 }
        )
      }
    }

    // Check if we have a session now
    if (!signInResult.data?.session) {
      return NextResponse.json(
        { success: false, message: 'Failed to create authentication session. Please try again.' },
        { status: 500 }
      )
    }

    // Build response and set session
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: employee.EmployeeID,
        username: employee.UserName,
        role: getRoleName(employee.RoleID),
        accessToken: signInResult.data.session.access_token,
        refreshToken: signInResult.data.session.refresh_token
      }
    }, { status: 200 })

    // Set session - this automatically sets cookies via SSR
    await supabase.auth.setSession({
      access_token: signInResult.data.session.access_token,
      refresh_token: signInResult.data.session.refresh_token
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}