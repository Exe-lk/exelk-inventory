// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// export const createServerClient = () => {
//   return createClient(supabaseUrl, supabaseAnonKey)
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)



import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Component - can be ignored if middleware handles refresh
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server Component - can be ignored
          }
        },
      },
    }
  )
}

// For middleware use
export function createMiddlewareClient(request: Request) {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookieHeader = request.headers.get('cookie')
          if (!cookieHeader) return undefined
          
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            if (key && value) {
              acc[key] = decodeURIComponent(value)
            }
            return acc
          }, {} as Record<string, string>)
          
          return cookies[name]
        },
        set() {
          // Middleware can't set cookies directly
        },
        remove() {
          // Middleware can't remove cookies directly
        },
      },
    }
  )
}


// Admin client for server-side admin operations (user creation, etc.)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables')
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. Admin operations require service role key.')
  }

  // Validate service role key format (should start with 'eyJ' for JWT)
  if (!serviceRoleKey.startsWith('eyJ')) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY does not appear to be a valid JWT token')
  }

  // Create client with service role key and proper options
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Debug: Log client structure (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Admin client created:', {
      hasAuth: !!client.auth,
      hasAdmin: !!client.auth?.admin,
      // Note: Object.keys() may not show all methods as they might be non-enumerable
      adminKeys: client.auth?.admin ? Object.keys(client.auth.admin) : [],
      serviceRoleKeyLength: serviceRoleKey.length,
      serviceRoleKeyPrefix: serviceRoleKey.substring(0, 20) + '...'
    })
  }

  // Verify admin methods are available
  if (!client.auth) {
    throw new Error('Admin client does not have auth property. Check Supabase client initialization.')
  }

  if (!client.auth.admin) {
    throw new Error('Admin client does not have admin methods. This usually means SUPABASE_SERVICE_ROLE_KEY is incorrect or you are using anon key instead.')
  }

  // Note: We don't check for specific methods here because they might be non-enumerable
  // The methods will be available at runtime when using the service role key
  // If methods don't exist, the error will be caught in the calling code

  return client
}