import { User } from '@/types/user'

export const loginUser = async (username: string, password: string) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Login request failed:', error)
    return { success: false, message: 'Network error' }
  }
}

export const saveUserSession = (user: Omit<User, 'Password'>, token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  }
}

export const getUserSession = (): Omit<User, 'Password'> | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

export const clearUserSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
}