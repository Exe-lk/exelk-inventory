// import { NextRequest, NextResponse } from 'next/server'
// import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt'
// import { getAuthTokenFromCookies, getRefreshTokenFromCookies } from '@/lib/cookies'

// // Define protected routes
// const protectedRoutes = ['/home', '/create-account', '/dashboard']
// const authRoutes = ['/login']

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl
  
//   // Check if the route is protected
//   const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
//   const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

//   // Get tokens from cookies
//   const accessToken = getAuthTokenFromCookies(request)
//   const refreshToken = getRefreshTokenFromCookies(request)

//   // If it's a protected route
//   if (isProtectedRoute) {
//     if (!accessToken && !refreshToken) {
//       // No tokens, redirect to login
//       return NextResponse.redirect(new URL('/', request.url))
//     }

//     if (accessToken) {
//       try {
//         // Verify access token
//         verifyAccessToken(accessToken)
//         return NextResponse.next()
//       } catch (error) {
//         // Access token invalid, check refresh token
//         if (refreshToken) {
//           try {
//             verifyRefreshToken(refreshToken)
//             // Refresh token is valid, let the request continue
//             // The API will handle token refresh
//             return NextResponse.next()
//           } catch (refreshError) {
//             // Both tokens invalid, redirect to login
//             const response = NextResponse.redirect(new URL('/', request.url))
//             response.cookies.delete('auth-token')
//             response.cookies.delete('refresh-token')
//             return response
//           }
//         } else {
//           // No refresh token, redirect to login
//           return NextResponse.redirect(new URL('/', request.url))
//         }
//       }
//     }
//     if (!accessToken && refreshToken) {
//       try {
//         verifyRefreshToken(refreshToken)
//         // Refresh token is valid, let the request continue
//         return NextResponse.next()
//       } catch (refreshError) {
//         // Refresh token invalid, redirect to login
//         const response = NextResponse.redirect(new URL('/', request.url))
//         response.cookies.delete('auth-token')
//         response.cookies.delete('refresh-token')
//         return response
//       }
//     }
//   }

//   // If user is logged in and trying to access auth routes, redirect to home
//   if (isAuthRoute && accessToken) {
//     try {
//       verifyAccessToken(accessToken)
//       return NextResponse.redirect(new URL('/home', request.url))
//     } catch (error) {
//       // Token invalid, allow access to auth route
//       return NextResponse.next()
//     }
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// }




import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt'

// Define protected routes
const protectedRoutes = ['/home', '/create-account', '/dashboard']
const authRoutes = ['/login']

const COOKIE_NAME = process.env.COOKIE_NAME || 'auth-token'
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refresh-token'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Get tokens from cookies using NextRequest.cookies (more efficient for middleware)
  const accessToken = request.cookies.get(COOKIE_NAME)?.value || null
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value || null

  // If it's a protected route
  if (isProtectedRoute) {
    if (!accessToken && !refreshToken) {
      // No tokens, redirect to login
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (accessToken) {
      try {
        // Verify access token
        verifyAccessToken(accessToken)
        return NextResponse.next()
      } catch (error) {
        // Access token invalid, check refresh token
        if (refreshToken) {
          try {
            verifyRefreshToken(refreshToken)
            // Refresh token is valid, let the request continue
            // The API will handle token refresh
            return NextResponse.next()
          } catch (refreshError) {
            // Both tokens invalid, redirect to login
            const response = NextResponse.redirect(new URL('/', request.url))
            response.cookies.delete(COOKIE_NAME)
            response.cookies.delete(REFRESH_COOKIE_NAME)
            return response
          }
        } else {
          // No refresh token, redirect to login
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    }
    
    if (!accessToken && refreshToken) {
      try {
        verifyRefreshToken(refreshToken)
        // Refresh token is valid, let the request continue
        return NextResponse.next()
      } catch (refreshError) {
        // Refresh token invalid, redirect to login
        const response = NextResponse.redirect(new URL('/', request.url))
        response.cookies.delete(COOKIE_NAME)
        response.cookies.delete(REFRESH_COOKIE_NAME)
        return response
      }
    }
  }

  // If user is logged in and trying to access auth routes, redirect to home
  if (isAuthRoute && accessToken) {
    try {
      verifyAccessToken(accessToken)
      return NextResponse.redirect(new URL('/home', request.url))
    } catch (error) {
      // Token invalid, allow access to auth route
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}