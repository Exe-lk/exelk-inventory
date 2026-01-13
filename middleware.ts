
// import { NextRequest, NextResponse } from 'next/server'
// import { createMiddlewareClient } from '@/lib/supabase/server'

// const protectedRoutes = ['/home', '/create-account', '/dashboard']
// const authRoutes = ['/login']

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl
  
//   const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
//   const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

//   // Create Supabase client for middleware
//   const supabase = createMiddlewareClient(request)

//   // Get user (more efficient than getSession)
//   const { data: { user }, error } = await supabase.auth.getUser()

//   // If it's a protected route
//   if (isProtectedRoute) {
//     if (error || !user) {
//       // No session, redirect to login
//       const loginUrl = new URL('/', request.url)
//       return NextResponse.redirect(loginUrl, { status: 307 })
//     }

//     // User exists, allow access
//     return NextResponse.next()
//   }

//   // If user is logged in and trying to access auth routes, redirect to home
//   if (isAuthRoute && user) {
//     return NextResponse.redirect(new URL('/home', request.url))
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// }








import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/server'

const protectedRoutes = ['/home', '/create-account', '/dashboard', '/product', '/stock', '/grn', '/gin', '/return', '/bincard', '/supplier', '/brand', '/category', '/model', '/productvariation', '/productversion', '/import', '/transactionlog']
const authRoutes = ['/login']
const publicRoutes = ['/'] // Root path is public

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Create Supabase client for middleware
  const supabase = createMiddlewareClient(request)

  // Get user (more efficient than getSession)
  const { data: { user }, error } = await supabase.auth.getUser()

  // If it's a protected route
  if (isProtectedRoute) {
    if (error || !user) {
      // No session, redirect to login (root path)
      const loginUrl = new URL('/', request.url)
      return NextResponse.redirect(loginUrl, { status: 307 })
    }

    // User exists, allow access
    return NextResponse.next()
  }

  // If user is logged in and trying to access auth routes, redirect to home
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|swagger).*)',
  ],
}