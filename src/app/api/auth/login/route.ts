
// import { NextRequest, NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase/server'
// import { LoginRequest, LoginResponse } from '@/types/user'
// import { generateTokenPair } from '@/lib/jwt'
// import { setAuthCookies } from '@/lib/cookies'
// import { verifyPassword } from '@/lib/password'


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

//     const supabase = createServerClient()

//     // Query the employees table
//     const { data: employee, error } = await supabase
//       .from('employees')
//       .select('*')
//       .eq('UserName', username)
//       .single()

//     if (error || !employee) {
//       return NextResponse.json(
//         { success: false, message: 'Invalid username or password' },
//         { status: 401 }
//       )
//     }

//     // Verify password (assuming passwords are hashed in your database)
   
//     const isPasswordValid = password === employee.Password
//     // For hashed passwords, use: await verifyPassword(password, employee.Password)

//     if (!isPasswordValid) {
//       return NextResponse.json(
//         { success: false, message: 'Invalid username or password' },
//         { status: 401 }
//       )
//     }

//     // Remove password from response
//     const { Password, ...employeeWithoutPassword } = employee

//     // Generate JWT tokens
//     const { accessToken, refreshToken } = generateTokenPair(employeeWithoutPassword)

//     // Get role name
//     const getRoleName = (roleID: number): string => {
//       switch (roleID) {
//         case 1:
//           return 'superAdmin'
//         case 2:
//           return 'admin'
//         case 3:
//           return 'stockKeeper'
//         default:
//           return 'user'
//       }
//     }

//     const response: LoginResponse = {
//       success: true,
//       message: 'Login successful',
//       data: {
//         userId: employee.EmployeeID,
//         username: employee.UserName,
//         role: getRoleName(employee.RoleID),
//         accessToken,
//         refreshToken
//       }
//     }

//     const nextResponse = NextResponse.json(response, { status: 200 })

//     // Set HTTP-only cookies
//     setAuthCookies(nextResponse, accessToken, refreshToken)

//     return nextResponse

//   } catch (error) {
//     console.error('Login error:', error)
//     return NextResponse.json(
//       { success: false, message: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }


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

//     // Create Supabase clients
//     const supabase = await createServerClient()
//     const adminClient = createAdminClient()

//     // Check if user exists in Supabase Auth
//     let authUser = null
//     try {
//       const { data, error } = await adminClient.auth.admin.getUserByEmail(employee.Email)
//       if (!error && data?.user) {
//         authUser = data.user
//       }
//     } catch (error) {
//       console.log('User not found in Supabase Auth, will create new one')
//     }

//     // If user doesn't exist, create them
//     if (!authUser) {
//       const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
//         email: employee.Email,
//         password: password,
//         email_confirm: true,
//         user_metadata: {
//           employee_id: employee.EmployeeID,
//           username: employee.UserName,
//           role_id: employee.RoleID
//         }
//       })

//       if (createError || !newUser?.user) {
//         console.error('Error creating Supabase user:', createError)
//         return NextResponse.json(
//           { success: false, message: 'Failed to create authentication session' },
//           { status: 500 }
//         )
//       }

//       authUser = newUser.user
//     } else {
//       // Only update metadata, not password (security best practice)
//       await adminClient.auth.admin.updateUserById(authUser.id, {
//         user_metadata: {
//           employee_id: employee.EmployeeID,
//           username: employee.UserName,
//           role_id: employee.RoleID
//         }
//       })
//     }

//     // Sign in with Supabase Auth
//     const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
//       email: employee.Email,
//       password: password
//     })

//     if (signInError || !signInData.session) {
//       console.error('Sign-in error:', signInError)
//       return NextResponse.json(
//         { success: false, message: 'Failed to create authentication session' },
//         { status: 500 }
//       )
//     }

//     // Build response
//     const response = NextResponse.json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         userId: employee.EmployeeID,
//         username: employee.UserName,
//         role: getRoleName(employee.RoleID),
//         accessToken: signInData.session.access_token,
//         refreshToken: signInData.session.refresh_token
//       }
//     }, { status: 200 })

//     // Set session - this will automatically set cookies via the SSR client
//     await supabase.auth.setSession({
//       access_token: signInData.session.access_token,
//       refresh_token: signInData.session.refresh_token
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

    // Try to sign in first (user might already exist in Supabase Auth)
    let signInData = null
    let signInError = null
    
    try {
      const result = await supabase.auth.signInWithPassword({
        email: employee.Email,
        password: password
      })
      signInData = result.data
      signInError = result.error
    } catch (error: any) {
      signInError = error
    }

    // If sign-in fails, user doesn't exist - create them using admin client
    if (signInError || !signInData?.session) {
      console.log('Sign-in failed, attempting to create user in Supabase Auth...')
      
      let adminClient
      try {
        adminClient = createAdminClient()
      } catch (error: any) {
        console.error('Error creating admin client:', error.message)
        return NextResponse.json(
          { success: false, message: 'Server configuration error. Please contact administrator.' },
          { status: 500 }
        )
      }

      // Try to create user using admin client
      try {
        // Check if user exists first (using listUsers and filter, or try createUser)
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
          // If user already exists (email_exists error), try to update password and sign in
          if (createError.code === 'email_exists' || createError.message?.includes('already been registered')) {
            console.log('User already exists, updating password and retrying sign-in...')
            
            // Try to list users and find by email (workaround if getUserByEmail doesn't work)
            try {
              const { data: usersList, error: listError } = await adminClient.auth.admin.listUsers()
              
              if (!listError && usersList?.users) {
                const existingUser = usersList.users.find(u => u.email === employee.Email)
                
                if (existingUser) {
                  // Update password and metadata
                  await adminClient.auth.admin.updateUserById(existingUser.id, {
                    password: password,
                    user_metadata: {
                      employee_id: employee.EmployeeID,
                      username: employee.UserName,
                      role_id: employee.RoleID
                    }
                  })
                  
                  // Retry sign-in
                  const retryResult = await supabase.auth.signInWithPassword({
                    email: employee.Email,
                    password: password
                  })
                  
                  if (retryResult.data?.session) {
                    signInData = retryResult.data
                    signInError = null
                  } else {
                    throw new Error('Failed to sign in after password update')
                  }
                } else {
                  throw new Error('User not found in list')
                }
              } else {
                throw new Error('Failed to list users')
              }
            } catch (listError: any) {
              console.error('Error listing/updating user:', listError)
              return NextResponse.json(
                { success: false, message: 'Failed to create authentication session. Please contact administrator.' },
                { status: 500 }
              )
            }
          } else {
            console.error('Error creating Supabase user:', createError)
            return NextResponse.json(
              { success: false, message: 'Failed to create authentication session' },
              { status: 500 }
            )
          }
        } else if (newUser?.user) {
          // User created successfully, now sign in
          const newSignInResult = await supabase.auth.signInWithPassword({
            email: employee.Email,
            password: password
          })
          
          if (newSignInResult.data?.session) {
            signInData = newSignInResult.data
            signInError = null
          } else {
            return NextResponse.json(
              { success: false, message: 'User created but sign-in failed. Please try again.' },
              { status: 500 }
            )
          }
        }
      } catch (adminError: any) {
        console.error('Error with admin operations:', adminError)
        
        // If admin methods don't work, return a helpful error
        if (adminError.message?.includes('is not a function')) {
          return NextResponse.json(
            { success: false, message: 'Server configuration error. Admin methods not available. Please update Supabase client or contact administrator.' },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          { success: false, message: 'Failed to create authentication session' },
          { status: 500 }
        )
      }
    }

    // If we still don't have a session, return error
    if (!signInData?.session) {
      return NextResponse.json(
        { success: false, message: 'Failed to create authentication session' },
        { status: 500 }
      )
    }

    // Build response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: employee.EmployeeID,
        username: employee.UserName,
        role: getRoleName(employee.RoleID),
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token
      }
    }, { status: 200 })

    // Set session - this will automatically set cookies via the SSR client
    await supabase.auth.setSession({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}