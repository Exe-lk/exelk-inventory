


// 'use client'

// import { useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import Login from '@/components/login/login'
// import { getCurrentUser } from '@/lib/auth'
// import { useState } from 'react'
// import { Employee } from '@/types/user'

// export default function RootPage() {
//   const router = useRouter()
//   const [isCheckingAuth, setIsCheckingAuth] = useState(true)
//   const [isAuthenticated, setIsAuthenticated] = useState(false)

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const user = await getCurrentUser()
//         if (user) {
//           setIsAuthenticated(true)
//           //router.push('/home')
//           window.location.href = '/home'
//         } else {
//           setIsAuthenticated(false)
//         }
//       } catch (error) {
//         console.error('Auth check failed:', error)
//         setIsAuthenticated(false)
//       } finally {
//         setIsCheckingAuth(false)
//       }
//     }

//     checkAuth()
//   }, [router])

//   const handleLogin = (user: Omit<Employee, 'Password'>) => {
//     setIsAuthenticated(true)
//     //router.push('/home')
//   }

//   if (isCheckingAuth) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="flex flex-col items-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
//           <div className="text-lg text-gray-600">Loading...</div>
//         </div>
//       </div>
//     )
//   }

//   return <Login onLogin={handleLogin} />
// }





'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Login from '@/components/login/login'
import { getCurrentUser } from '@/lib/auth'
import { useState } from 'react'
import { Employee } from '@/types/user'

export default function RootPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const hasCheckedAuth = useRef(false) // Prevent multiple checks

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return
    hasCheckedAuth.current = true

    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setIsAuthenticated(true)
          // Use router.push instead of window.location to prevent full page reload
          router.push('/home')
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    setIsAuthenticated(true)
    // Use router.push for smooth navigation
    router.push('/home')
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  return <Login onLogin={handleLogin} />
}