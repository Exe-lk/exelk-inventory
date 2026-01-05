import { NextResponse } from 'next/server'

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
  const commonOptions: CookieOptions = {
    httpOnly: true,
    secure: IS_SECURE,
    sameSite: IS_SECURE ? 'lax' : 'lax', 
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
}

export function clearAuthCookies(response: NextResponse): void {
  const commonOptions: CookieOptions = {
    httpOnly: true,
    secure: IS_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  }

  response.cookies.set(COOKIE_NAME, '', commonOptions)
  response.cookies.set(REFRESH_COOKIE_NAME, '', commonOptions)
}

export function getAuthTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = parseCookies(cookieHeader)
  return cookies[COOKIE_NAME] || null
}

export function getRefreshTokenFromCookies(request: Request): string | null {
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

