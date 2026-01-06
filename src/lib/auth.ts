// import { LoginRequest, LoginResponse } from '@/types/user'

// export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
//   try {
//     const response = await fetch('/api/auth/login', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(credentials),
//     })

//     const data: LoginResponse = await response.json()

//     if (!response.ok) {
//       throw new Error(data.message || 'Login failed')
//     }

//     return data
//   } catch (error) {
//     console.error('Login error:', error)
//     throw error
//   }
// }

// export const saveUserSession = (user: any, token: string): void => {
//   try {
//     localStorage.setItem('user', JSON.stringify(user))
//     localStorage.setItem('token', token)
//   } catch (error) {
//     console.error('Error saving user session:', error)
//   }
// }

// export const getUserSession = (): any | null => {
//   try {
//     if (typeof window === 'undefined') return null // Server-side check
//     const user = localStorage.getItem('user')
//     return user ? JSON.parse(user) : null
//   } catch (error) {
//     console.error('Error getting user session:', error)
//     return null
//   }
// }

// export const clearUserSession = (): void => {
//   try {
//     if (typeof window === 'undefined') return // Server-side check
//     localStorage.removeItem('user')
//     localStorage.removeItem('token')
//   } catch (error) {
//     console.error('Error clearing user session:', error)
//   }
// }

// export const logoutUser = async (): Promise<void> => {
//   try {
//     clearUserSession()
//     // You can also call a logout API endpoint here if needed
//   } catch (error) {
//     console.error('Logout error:', error)
//   }
// }

// export const getCurrentUser = (): any | null => {
//   return getUserSession()
// }

// export const setCurrentUser = (user: any): void => {
//   try {
//     if (typeof window === 'undefined') return // Server-side check
//     localStorage.setItem('user', JSON.stringify(user))
//   } catch (error) {
//     console.error('Error setting current user:', error)
//   }
// }

// export const getAuthToken = (): string | null => {
//   try {
//     if (typeof window === 'undefined') return null // Server-side check
//     return localStorage.getItem('token')
//   } catch (error) {
//     console.error('Error getting auth token:', error)
//     return null
//   }
// }

import { LoginRequest, LoginResponse, Employee } from '@/types/user'

// export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
//   try {
//     const response = await fetch('/api/auth/login', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(credentials),
//       credentials: 'include', // Important for cookies
//     })

//     const data: LoginResponse = await response.json()

//     if (!response.ok) {
//       throw new Error(data.message || 'Login failed')
//     }

//     return data
//   } catch (error) {
//     console.error('Login error:', error)
//     throw error
//   }
// }


// ... existing code ...

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    console.log('loginUser called with:', { username: credentials.username })
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Important for cookies
    })

    console.log('Login fetch response status:', response.status)
    console.log('Login fetch response ok:', response.ok)

    // Check if response is ok before parsing JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON response:', text)
      throw new Error('Invalid response from server')
    }

    const data: LoginResponse = await response.json()
    console.log('Login response data:', data)

    if (!response.ok) {
      console.error('Login failed with status:', response.status, data)
      throw new Error(data.message || 'Login failed')
    }

    return data
  } catch (error: any) {
    console.error('Login error in loginUser:', error)
    // Re-throw with more context
    if (error instanceof Error) {
      throw error
    }
    throw new Error(error?.message || 'Login failed. Please try again.')
  }
}

// ... rest of the file remains the same ...


// export const getCurrentUser = async (): Promise<Omit<Employee, 'Password'> | null> => {
//   try {
//     const response = await fetch('/api/auth/me', {
//       method: 'GET',
//       credentials: 'include', // Important for cookies
//     })

//     if (!response.ok) {
//       return null
//     }

//     const data = await response.json()
//     return data.success ? data.data.user : null
//   } catch (error) {
//     console.error('Get current user error:', error)
//     return null
//   }
// }

export const getCurrentUser = async (): Promise<Employee | null> => {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.success ? data.data.user : null
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export const refreshToken = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })

    return response.ok
  } catch (error) {
    console.error('Token refresh error:', error)
    return false
  }
}

export const logoutUser = async (): Promise<void> => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.error('Logout error:', error)
  }
}



// Legacy functions for backward compatibility
export const clearUserSession = (): void => {
  // This is now handled by the logout API
  logoutUser()
}

export const getUserSession = (): any | null => {
  // This is now handled by the getCurrentUser API
  return null
}

export const saveUserSession = (user: any, token: string): void => {
  // This is now handled by HTTP-only cookies
  // No longer needed on client side
}

export const setCurrentUser = (user: any): void => {
  // This is now handled by HTTP-only cookies
  // No longer needed on client side
}

export const getAuthToken = (): string | null => {
  // Tokens are now in HTTP-only cookies
  // Not accessible from client side
  return null
}