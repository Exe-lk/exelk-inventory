// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik'
// import * as Yup from 'yup'
// import { loginUser } from '@/lib/auth'

// interface LoginProps {
//   onLogin?: (user: any) => void
// }

// interface LoginFormValues {
//   username: string
//   password: string
// }

// // Validation Schema
// const LoginSchema = Yup.object().shape({
//   username: Yup.string()
//     .min(3, "Username must be at least 3 characters long")
//     .required("Username is required"),
//   password: Yup.string()
//     .min(8, "Password must be at least 8 characters long")
//     .matches(/[A-Z]/, "Must contain at least one uppercase letter")
//     .matches(/[a-z]/, "Must contain at least one lowercase letter")
//     .matches(/\d/, "Must contain at least one number")
//     .matches(/[!@#$%^&*]/, "Must contain one special character")
//     .required("Password is required"),
// })

// export default function Login({ onLogin }: LoginProps) {
//   const router = useRouter()
//   const [apiError, setApiError] = useState('')

//   const initialValues: LoginFormValues = {
//     username: '',
//     password: '',
//   }

//   const handleSubmit = async (
//     values: LoginFormValues, 
//     { setSubmitting, setStatus }: FormikHelpers<LoginFormValues>
//   ) => {
//     try {
//       setStatus(null)
//       setApiError('')
      
//       const response = await loginUser({
//         username: values.username,
//         password: values.password
//       })

//       if (response.success && response.employee) {
//         // Store user data
//         localStorage.setItem('user', JSON.stringify(response.employee))
//         localStorage.setItem('token', response.token || '')
        
//         // Call onLogin prop if provided
//         if (onLogin) {
//           onLogin(response.employee)
//         }
        
//         console.log('Login successful:', response.employee)
        
//         // Redirect to dashboard or home
//         router.push('/home')
//       } else {
//         const errorMessage = response.message || 'Login failed'
//         setStatus(errorMessage)
//         setApiError(errorMessage)
//       }
//     } catch (error: any) {
//       console.error('Login error:', error)
//       const errorMessage = error.message || 'Login failed. Please try again.'
//       setStatus(errorMessage)
//       setApiError(errorMessage)
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F9FF' }}>
//       <div 
//         className="bg-white rounded-lg shadow-lg p-8 w-[500px] min-h-[461px] flex flex-col justify-center"
//       >
//         <div className="text-center mb-8">
//           <h1 className="text-2xl font-bold text-gray-800 mb-2">Login</h1>
//           <p className="text-gray-600 text-sm">Welcome back! Please login to your account.</p>
//         </div>
        
//         <Formik
//           initialValues={initialValues}
//           validationSchema={LoginSchema}
//           onSubmit={handleSubmit}
//         >
//           {({ errors, touched, isValid, dirty, isSubmitting, status }) => (
//             <Form className="space-y-4">
//               {/* API Error Display */}
//               {(apiError || status) && (
//                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
//                   {apiError || status}
//                 </div>
//               )}
              
//               {/* Username Field */}
//               <div>
//                 <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
//                   Username
//                 </label>
//                 <Field
//                   id="username"
//                   name="username"
//                   type="text"
//                   placeholder="username"
//                   className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
//                     errors.username && touched.username 
//                       ? 'border-red-300 focus:ring-red-500' 
//                       : 'border-gray-300'
//                   }`}
//                   disabled={isSubmitting}
//                 />
//                 <ErrorMessage 
//                   name="username" 
//                   component="div" 
//                   className="mt-1 text-sm text-red-600" 
//                 />
//               </div>
              
//               {/* Password Field */}
//               <div>
//                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                   Password
//                 </label>
//                 <Field
//                   id="password"
//                   name="password"
//                   type="password"
//                   placeholder="password"
//                   className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
//                     errors.password && touched.password 
//                       ? 'border-red-300 focus:ring-red-500' 
//                       : 'border-gray-300'
//                   }`}
//                   disabled={isSubmitting}
//                 />
//                 <ErrorMessage 
//                   name="password" 
//                   component="div" 
//                   className="mt-1 text-sm text-red-600" 
//                 />
//               </div>

//               {/* Submit Button */}
//               <div className="pt-4">
//                 <button
//                   type="submit"
//                   disabled={isSubmitting || !isValid || !dirty}
//                   className="w-full py-3 px-4 text-white font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                   style={{ backgroundColor: isSubmitting || !isValid || !dirty ? '#94A3B8' : '#3751FE' }}
//                   onMouseEnter={(e) => {
//                     if (!isSubmitting && isValid && dirty) {
//                       e.currentTarget.style.backgroundColor = '#2940E6'
//                     }
//                   }}
//                   onMouseLeave={(e) => {
//                     if (!isSubmitting && isValid && dirty) {
//                       e.currentTarget.style.backgroundColor = '#3751FE'
//                     }
//                   }}
//                 >
//                   {isSubmitting ? 'Signing in...' : 'Login'}
//                 </button>
//               </div>
//             </Form>
//           )}
//         </Formik>
        
//         {/* <div className="mt-6 text-center">
//           <p className="text-xs text-gray-500 mb-2">Test Credentials:</p>
//           <div className="text-xs text-gray-600 space-y-1">
//             <div><strong>SuperAdmin:</strong> superadmin / Superadmin@1234</div>
//             <div><strong>Admin:</strong> admin / Admin@1234</div>
//             <div><strong>StockKeeper:</strong> stockkeeper / Stockkeeper@1234</div>
//           </div>
//         </div> */}
//       </div>
//     </div>
//   )
// }

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { loginUser } from '@/lib/auth'

interface LoginProps {
  onLogin?: (user: any) => void
}

interface LoginFormValues {
  username: string
  password: string
}

// Validation Schema
const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters long")
    .required("Username is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters long")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/\d/, "Must contain at least one number")
    .matches(/[!@#$%^&*]/, "Must contain one special character")
    .required("Password is required"),
})

export default function Login({ onLogin }: LoginProps) {
  const router = useRouter()
  const [apiError, setApiError] = useState('')

  const initialValues: LoginFormValues = {
    username: '',
    password: '',
  }

  const handleSubmit = async (
    values: LoginFormValues, 
    { setSubmitting, setStatus }: FormikHelpers<LoginFormValues>
  ) => {
    try {
      setStatus(null)
      setApiError('')
      
      const response = await loginUser({
        username: values.username,
        password: values.password
      })

      if (response.success && response.data) {
        // Call onLogin prop if provided
        if (onLogin) {
          onLogin({
            EmployeeID: response.data.userId,
            UserName: response.data.username,
            RoleID: response.data.role === 'superAdmin' ? 1 : 
                    response.data.role === 'admin' ? 2 : 
                    response.data.role === 'stockKeeper' ? 3 : 4
          })
        }
        
        console.log('Login successful:', response.data)
        
        // Redirect to dashboard or home
        router.push('/home')
      } else {
        const errorMessage = response.message || 'Login failed'
        setStatus(errorMessage)
        setApiError(errorMessage)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.message || 'Login failed. Please try again.'
      setStatus(errorMessage)
      setApiError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F9FF' }}>
      <div 
        className="bg-white rounded-lg shadow-lg p-8 w-[500px] min-h-[461px] flex flex-col justify-center"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Login</h1>
          <p className="text-gray-600 text-sm">Welcome back! Please login to your account.</p>
        </div>
        
        <Formik
          initialValues={initialValues}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isValid, dirty, isSubmitting, status }) => (
            <Form className="space-y-4">
              {/* API Error Display */}
              {(apiError || status) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                  {apiError || status}
                </div>
              )}
              
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <Field
                  id="username"
                  name="username"
                  type="text"
                  placeholder="username"
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                    errors.username && touched.username 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                <ErrorMessage 
                  name="username" 
                  component="div" 
                  className="mt-1 text-sm text-red-600" 
                />
              </div>
              
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  placeholder="password"
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                    errors.password && touched.password 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                <ErrorMessage 
                  name="password" 
                  component="div" 
                  className="mt-1 text-sm text-red-600" 
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid || !dirty}
                  className="w-full py-3 px-4 text-white font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: isSubmitting || !isValid || !dirty ? '#94A3B8' : '#3751FE' }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && isValid && dirty) {
                      e.currentTarget.style.backgroundColor = '#2940E6'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && isValid && dirty) {
                      e.currentTarget.style.backgroundColor = '#3751FE'
                    }
                  }}
                >
                  {isSubmitting ? 'Signing in...' : 'Login'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">Test Credentials:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>SuperAdmin:</strong> superadmin / Superadmin@1234</div>
            <div><strong>Admin:</strong> admin / Admin@1234</div>
            <div><strong>StockKeeper:</strong> stockkeeper / Stockkeeper@1234</div>
          </div>
        </div>
      </div>
    </div>
  )
}