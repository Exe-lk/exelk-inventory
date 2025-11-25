'use client'

import { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { loginUser, saveUserSession } from '@/lib/auth'

interface LoginProps {
  onLogin?: (user: any) => void
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
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const initialValues = {
    username: '',
    password: '',
  }

  const handleSubmit = async (values: typeof initialValues) => {
    setIsLoading(true)
    setApiError('')

    try {
      // Call login API
      const result = await loginUser(values.username, values.password)

      if (result.success) {
        // Save session
        saveUserSession(result.user, result.token)
        
        // Call onLogin prop if provided
        if (onLogin) {
          onLogin(result.user)
        }
        
        console.log('Login successful:', result.user)
      } else {
        setApiError(result.message)
      }
    } catch (error) {
      console.error('Login error:', error)
      setApiError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
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
          {({ errors, touched, isValid, dirty }) => (
            <Form className="space-y-4">
              {/* API Error Display */}
              {apiError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                  {apiError}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading || !isValid || !dirty}
                  className="w-full py-3 px-4 text-white font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: isLoading || !isValid || !dirty ? '#94A3B8' : '#3751FE' }}
                  onMouseEnter={(e) => {
                    if (!isLoading && isValid && dirty) {
                      e.currentTarget.style.backgroundColor = '#2940E6'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && isValid && dirty) {
                      e.currentTarget.style.backgroundColor = '#3751FE'
                    }
                  }}
                >
                  {isLoading ? 'Signing in...' : 'Login'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          
        </div>
      </div>
    </div>
  )
}