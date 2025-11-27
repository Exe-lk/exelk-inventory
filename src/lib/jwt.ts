import jwt, { SignOptions } from 'jsonwebtoken'
import { Employee } from '@/types/user'

export interface JWTPayload {
  userId: number
  username: string
  email: string
  role: string
  roleId: number
  iat?: number
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}


console.log('JWT_SECRET :', process.env.JWT_SECRET)
console.log('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET)
console.log('JWT_ACCESS_EXPIRES_IN:', process.env.JWT_ACCESS_EXPIRES_IN || 'UNDEFINED')
console.log('JWT_REFRESH_EXPIRES_IN:', process.env.JWT_REFRESH_EXPIRES_IN || 'UNDEFINED')
console.log('NODE_ENV:', process.env.NODE_ENV)


// Get JWT secrets from environment with proper validation
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be defined in production')
    }
    // Use a default secret for development/build only
    return 'your-super-secret-jwt-key-min-32-characters-long'
  }
  return secret
}
console.log('JWT Secret Loaded:', getJWTSecret())

const getJWTRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_REFRESH_SECRET must be defined in production')
    }
    // Use a default secret for development/build only
    return 'your-super-secret-refresh-key-min-32-characters-long'
  }
  return secret
}

console.log('JWT Refresh Secret Loaded:', getJWTRefreshSecret())

// Get JWT secrets from environment
const JWT_SECRET = getJWTSecret()
const JWT_REFRESH_SECRET = getJWTRefreshSecret()
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

console.log('secret key',getJWTSecret())

console.log('refresh key',getJWTRefreshSecret())

console.log('ACCESS_TOKEN_EXPIRES_IN:', ACCESS_TOKEN_EXPIRES_IN)
console.log('REFRESH_TOKEN_EXPIRES_IN:', REFRESH_TOKEN_EXPIRES_IN)


// Helper function to get role name from RoleID
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

console.log('getRoleName function loaded')

export function generateTokenPair(employee: Omit<Employee, 'Password'>): TokenPair {
    console.log('Generating tokens for employee:', employee.EmployeeID)
  const payload: JWTPayload = {
    userId: employee.EmployeeID,
    username: employee.UserName,
    email: employee.Email,
    role: getRoleName(employee.RoleID),
    roleId: employee.RoleID,
  }

   const accessTokenOptions: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN as any,
  }

  console.log('Payload for JWT:', payload)
  const refreshTokenOptions: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as any,
  }

  console.log('Access Token Options:', accessTokenOptions)
  console.log('Refresh Token Options:', refreshTokenOptions)

  const accessToken = jwt.sign(payload, JWT_SECRET , accessTokenOptions)

  console.log('accessToken',accessToken|| 'no access token')

  const refreshToken = jwt.sign(
    { userId: employee.EmployeeID },
    JWT_REFRESH_SECRET,
    refreshTokenOptions
  )

    console.log('refreshToken',refreshToken || 'no refresh token')

  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): JWTPayload {
    console.log('Verifying access token:', token)
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    console.log('Access token verification error:', error)
    throw new Error('Invalid or expired access token')
  }
}

export function verifyRefreshToken(token: string): { userId: number } {
    console.log('Verifying refresh token:', token)
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: number }
  } catch (error) {
    console.log('Refresh token verification error:', error)
    throw new Error('Invalid or expired refresh token')
  }
}

export function generateAccessToken(userId: number, username: string, email: string, roleId: number): string {
    console.log('Generating new access token for userId:', userId)
  const payload: JWTPayload = {
    userId,
    username,
    email,
    role: getRoleName(roleId),
    roleId,
  }

  const accessTokenOptions: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN as any,
  }

  return jwt.sign(payload, JWT_SECRET, accessTokenOptions)
}

