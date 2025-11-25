import { NextRequest, NextResponse } from 'next/server'
import usersData from '@/data/users.json'
import { User, LoginResponse } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Basic validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user in the JSON data
    const user = usersData.users.find(
      (u: User) => u.Username === username && u.Password === password
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Remove password from response
    const { Password, ...userWithoutPassword } = user

    const response: LoginResponse = {
      success: true,
      user: userWithoutPassword,
      message: 'Login successful',
      token: `mock-token-${user.UserID}-${Date.now()}` // Mock token for demo
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}