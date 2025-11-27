// import { NextRequest, NextResponse } from 'next/server';
// import { createServerClient } from '@/lib/supabase/server';
// import { LoginRequest, LoginResponse, Employee } from '@/types/user';

// export async function POST(request: NextRequest) {
//   try {
//     const body: LoginRequest = await request.json();
//     const { username, password } = body;

//     if (!username || !password) {
//       return NextResponse.json(
//         { success: false, message: 'Username and password are required' },
//         { status: 400 }
//       );
//     }

//     const supabase = createServerClient();

//     // Query the employees table
//     const { data: employees, error } = await supabase
//       .from('employees')
//       .select('*')
//       .eq('UserName', username)
//       .eq('Password', password)
//       .single();

//     if (error || !employees) {
//       return NextResponse.json(
//         { success: false, message: 'Invalid username or password' },
//         { status: 401 }
//       );
//     }

//     // Remove password from response
//     const { Password, ...employeeWithoutPassword } = employees;

//     const response: LoginResponse = {
//       success: true,
//       employee: employeeWithoutPassword,
//       message: 'Login successful',
//       token: 'dummy-jwt-token' // You can implement proper JWT here
//     };

//     return NextResponse.json(response, { status: 200 });

//   } catch (error) {
//     console.error('Login error:', error);
//     return NextResponse.json(
//       { success: false, message: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { LoginRequest, LoginResponse } from '@/types/user'
import { generateTokenPair } from '@/lib/jwt'
import { setAuthCookies } from '@/lib/cookies'
import { verifyPassword } from '@/lib/password'

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

    const supabase = createServerClient()

    // Query the employees table
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('UserName', username)
      .single()

    if (error || !employee) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password (assuming passwords are hashed in your database)
    // If your passwords are not hashed, you can use direct comparison for now
    const isPasswordValid = password === employee.Password
    // For hashed passwords, use: await verifyPassword(password, employee.Password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Remove password from response
    const { Password, ...employeeWithoutPassword } = employee

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokenPair(employeeWithoutPassword)

    // Get role name
    const getRoleName = (roleID: number): string => {
      switch (roleID) {
        case 1:
          return 'superAdmin'
        case 2:
          return 'admin'
        case 3:
          return 'stockKeeper'
        default:
          return 'user'
      }
    }

    const response: LoginResponse = {
      success: true,
      message: 'Login successful',
      data: {
        userId: employee.EmployeeID,
        username: employee.UserName,
        role: getRoleName(employee.RoleID),
        accessToken,
        refreshToken
      }
    }

    const nextResponse = NextResponse.json(response, { status: 200 })

    // Set HTTP-only cookies
    setAuthCookies(nextResponse, accessToken, refreshToken)

    return nextResponse

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

