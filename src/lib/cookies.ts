import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = process.env.COOKIE_NAME || 'auth-token'
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refresh-token'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_SECURE = process.env.NEXT_PUBLIC_IS_HTTPS === 'true' || IS_PRODUCTION

export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {

  const isProduction = process.env.NODE_ENV === 'production'
  const isSecure = isProduction || process.env.NEXT_PUBLIC_IS_HTTPS === 'true'

  const commonOptions: CookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax', 
    path: '/',
  }

  // Set access token cookie (15 minutes)
  response.cookies.set(COOKIE_NAME, accessToken, {
    ...commonOptions,
    maxAge: 15 * 60, // 15 minutes
  })

  // Set refresh token cookie (7 days)
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    ...commonOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  if (process.env.NODE_ENV === 'production') {
    console.log('Cookies set in production:', {
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      cookieName: COOKIE_NAME,
      refreshCookieName: REFRESH_COOKIE_NAME
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Cookies set with options:', {
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      isProduction,
      cookieName: COOKIE_NAME,
      refreshCookieName: REFRESH_COOKIE_NAME
    })
  }
}

export function clearAuthCookies(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === 'production'
  const isSecure = isProduction || process.env.NEXT_PUBLIC_IS_HTTPS === 'true'

  const commonOptions: CookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  }

  response.cookies.set(COOKIE_NAME, '', commonOptions)
  response.cookies.set(REFRESH_COOKIE_NAME, '', commonOptions)
}

export function getAuthTokenFromCookies(request: Request | NextRequest): string | null {
  // Check if it's a NextRequest (has cookies property)
  if ('cookies' in request && request.cookies && typeof request.cookies.get === 'function') {
    const cookie = request.cookies.get(COOKIE_NAME)
    return cookie?.value || null
  }
  
  // Fallback to header parsing for regular Request objects
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = parseCookies(cookieHeader)
  return cookies[COOKIE_NAME] || null
}

// Updated to support both Request and NextRequest
export function getRefreshTokenFromCookies(request: Request | NextRequest): string | null {
  // Check if it's a NextRequest (has cookies property)
  if ('cookies' in request && request.cookies && typeof request.cookies.get === 'function') {
    const cookie = request.cookies.get(REFRESH_COOKIE_NAME)
    return cookie?.value || null
  }
  
  // Fallback to header parsing for regular Request objects
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = parseCookies(cookieHeader)
  return cookies[REFRESH_COOKIE_NAME] || null
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader
    .split(';')
    .reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[name] = decodeURIComponent(value)
      }
      return cookies
    }, {} as Record<string, string>)
}

