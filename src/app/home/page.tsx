'use client'

import { useState, useEffect } from 'react'
import Login from '@/components/login/login'
import { User } from '@/types/user'
import { getUserSession, clearUserSession } from '@/lib/auth'

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<Omit<User, 'Password'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const user = getUserSession()
    if (user) {
      setCurrentUser(user)
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (user: Omit<User, 'Password'>) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    clearUserSession()
    setIsLoggedIn(false)
    setCurrentUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Inventory Management System
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {currentUser?.FirstName} {currentUser?.LastName}!
              </span>
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                {currentUser?.Role.RoleName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Details Card */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">User Profile</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {currentUser?.FirstName} {currentUser?.LastName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{currentUser?.Email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{currentUser?.Phone}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{currentUser?.Username}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{currentUser?.Role.RoleName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Role Description</label>
                  <p className="mt-1 text-sm text-gray-900">{currentUser?.Role.Description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}