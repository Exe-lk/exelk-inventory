// 'use client'

// import { useState, useEffect } from 'react'
// import Login from '@/components/login/login'
// import Sidebar from '@/components/Admin/sidebar'
// import Navbar from '@/components/Common/navbar'
// import { Employee } from '@/types/user'
// import { getUserSession, clearUserSession } from '@/lib/auth'

// export default function HomePage() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false)
//   const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//   const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

//   useEffect(() => {
//     // Check for existing session
//     const user = getUserSession()
//     if (user) {
//       setCurrentUser(user)
//       setIsLoggedIn(true)
//     }
//     setIsLoading(false)
//   }, [])

//   const handleLogin = (user: Omit<Employee, 'Password'>) => {
//     setCurrentUser(user)
//     setIsLoggedIn(true)
//   }

//   const handleLogout = () => {
//     clearUserSession()
//     setIsLoggedIn(false)
//     setCurrentUser(null)
//   }

//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen)
//   }

//   const closeMobileSidebar = () => {
//     setIsSidebarOpen(false)
//   }

//   // Handle sidebar expand/collapse
//   const handleSidebarExpandChange = (isExpanded: boolean) => {
//     setIsSidebarExpanded(isExpanded)
//   }

//   // Helper function to get role name from RoleID
//   const getRoleName = (roleID: number): string => {
//     switch (roleID) {
//       case 1:
//         return 'SuperAdmin'
//       case 2:
//         return 'Admin'
//       case 3:
//         return 'StockKeeper'
//       default:
//         return `Role ${roleID}`
//     }
//   }

//   // Helper function to get role description from RoleID
//   const getRoleDescription = (roleID: number): string => {
//     switch (roleID) {
//       case 1:
//         return 'Full system access with all permissions'
//       case 2:
//         return 'Manages operations and inventory overview'
//       case 3:
//         return 'Handles stock updates and item tracking'
//       default:
//         return 'Custom role'
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="flex flex-col items-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
//           <div className="text-lg text-gray-600">Loading...</div>
//         </div>
//       </div>
//     )
//   }

//   if (!isLoggedIn) {
//     return <Login onLogin={handleLogin} />
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* Navbar - Full width at top */}
//       <Navbar 
//         currentUser={currentUser}
//         onMenuClick={toggleSidebar}
//       />

//       {/* Sidebar - Below navbar */}
//       <Sidebar 
//         onLogout={handleLogout} 
//         isMobileOpen={isSidebarOpen}
//         onMobileClose={closeMobileSidebar}
//         onExpandedChange={handleSidebarExpandChange}
//       />

//       {/* Main Content - Dynamically adjust based on sidebar state */}
//       <div 
//         className={`pt-[70px] transition-all duration-300 ease-in-out ${
//           isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'
//         }`}
//       >
//         <main className="overflow-y-auto bg-gray-50 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
//           <div className="max-w-full">
//             {/* Welcome Section */}
//             <div className="mb-8">
//               <h1 className="text-3xl font-bold text-gray-900 mb-2">
//                 Welcome back, {currentUser?.UserName}!
//               </h1>
//               <p className="text-gray-600">
//                 Here's what's happening with your inventory management system today.
//               </p>
//             </div>

//             {/* Employee Details Card */}
//             <div className="bg-white shadow rounded-lg mb-6">
//               <div className="px-6 py-4 border-b border-gray-200">
//                 <h2 className="text-lg font-medium text-gray-900">Employee Profile</h2>
//               </div>
//               <div className="px-6 py-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-500">Employee ID</label>
//                     <p className="mt-1 text-sm text-gray-900">
//                       {currentUser?.EmployeeID ? String(currentUser.EmployeeID).padStart(3, '0') : 'N/A'}
//                     </p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-500">Username</label>
//                     <p className="mt-1 text-sm text-gray-900">{currentUser?.UserName || 'N/A'}</p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-500">Email</label>
//                     <p className="mt-1 text-sm text-gray-900">{currentUser?.Email || 'N/A'}</p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-500">Phone</label>
//                     <p className="mt-1 text-sm text-gray-900">
//                       {currentUser?.Phone ? currentUser.Phone.replace(/^\+1/, '0') : 'N/A'}
//                     </p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-500">Role</label>
//                     <p className="mt-1 text-sm text-gray-900">
//                       {currentUser?.RoleID ? (
//                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                           {getRoleName(currentUser.RoleID)}
//                         </span>
//                       ) : 'N/A'}
//                     </p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-500">Role Description</label>
//                     <p className="mt-1 text-sm text-gray-900">
//                       {currentUser?.RoleID ? getRoleDescription(currentUser.RoleID) : 'N/A'}
//                     </p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-500">Account Created</label>
//                     <p className="mt-1 text-sm text-gray-900">
//                       {currentUser?.CreatedDate ? 
//                         new Date(currentUser.CreatedDate).toLocaleDateString('en-US', {
//                           year: 'numeric',
//                           month: 'long',
//                           day: 'numeric'
//                         }) : 'N/A'
//                       }
//                     </p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-500">Created By</label>
//                     <p className="mt-1 text-sm text-gray-900">
//                       {currentUser?.CreatedBy ? 
//                         (currentUser.CreatedBy === 1 && currentUser.EmployeeID === 1 ? 'System' : `Employee ${currentUser.CreatedBy}`) 
//                         : 'N/A'
//                       }
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Dashboard Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
//                   <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
//                     <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                     </svg>
//                   </div>
//                 </div>
//                 <p className="text-gray-600 text-sm">Dashboard content will go here</p>
//                 <div className="mt-4">
//                   <span className="text-2xl font-bold text-gray-900">0</span>
//                   <span className="text-sm text-gray-500 ml-1">Total Items</span>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
//                   <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
//                     <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                     </svg>
//                   </div>
//                 </div>
//                 <p className="text-gray-600 text-sm">Recent activities will be displayed here</p>
//                 <div className="mt-4">
//                   <span className="text-2xl font-bold text-gray-900">0</span>
//                   <span className="text-sm text-gray-500 ml-1">Recent Actions</span>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
//                   <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
//                     <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h5c0-5.523 4.477-10 10-10v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2c5.523 0 10 4.477 10 10z" />
//                     </svg>
//                   </div>
//                 </div>
//                 <p className="text-gray-600 text-sm">System notifications will appear here</p>
//                 <div className="mt-4">
//                   <span className="text-2xl font-bold text-gray-900">0</span>
//                   <span className="text-sm text-gray-500 ml-1">Alerts</span>
//                 </div>
//               </div>
//             </div>

//             {/* Additional Action Cards */}
//             <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div className="bg-white p-6 rounded-lg shadow">
//                 <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
//                 <div className="space-y-3">
//                   <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200">
//                     <span className="font-medium text-gray-900">Add New Item</span>
//                     <p className="text-sm text-gray-500">Add a new item to inventory</p>
//                   </button>
//                   <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200">
//                     <span className="font-medium text-gray-900">Generate Report</span>
//                     <p className="text-sm text-gray-500">Create inventory reports</p>
//                   </button>
//                 </div>
//               </div>

//               <div className="bg-white p-6 rounded-lg shadow">
//                 <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
//                 <div className="space-y-3">
//                   <div className="flex items-center justify-between p://3 rounded-lg bg-green-50">
//                     <span className="text-sm font-medium text-gray-900">Database</span>
//                     <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Online</span>
//                   </div>
//                   <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
//                     <span className="text-sm font-medium text-gray-900">API Services</span>
//                     <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Login from '@/components/login/login'
import Sidebar from '@/components/Admin/sidebar'
import Navbar from '@/components/Common/navbar'
import { Employee } from '@/types/user'
import { getCurrentUser, logoutUser } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setCurrentUser(user)
          setIsLoggedIn(true)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      setIsLoggedIn(false)
      setCurrentUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeMobileSidebar = () => {
    setIsSidebarOpen(false)
  }

  // Handle sidebar expand/collapse
  const handleSidebarExpandChange = (isExpanded: boolean) => {
    setIsSidebarExpanded(isExpanded)
  }

  // Helper function to get role name from RoleID
  const getRoleName = (roleID: number): string => {
    switch (roleID) {
      case 1:
        return 'SuperAdmin'
      case 2:
        return 'Admin'
      case 3:
        return 'StockKeeper'
      default:
        return `Role ${roleID}`
    }
  }

  // Helper function to get role description from RoleID
  const getRoleDescription = (roleID: number): string => {
    switch (roleID) {
      case 1:
        return 'Full system access with all permissions'
      case 2:
        return 'Manages operations and inventory overview'
      case 3:
        return 'Handles stock updates and item tracking'
      default:
        return 'Custom role'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar - Full width at top */}
      <Navbar 
        currentUser={currentUser}
        onMenuClick={toggleSidebar}
      />

      {/* Sidebar - Below navbar */}
      <Sidebar 
        onLogout={handleLogout} 
        isMobileOpen={isSidebarOpen}
        onMobileClose={closeMobileSidebar}
        onExpandedChange={handleSidebarExpandChange}
      />

      {/* Main Content - Dynamically adjust based on sidebar state */}
      <div 
        className={`pt-[70px] transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'
        }`}
      >
        <main className="overflow-y-auto bg-gray-50 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
          <div className="max-w-full">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {currentUser?.UserName}!
              </h1>
              <p className="text-gray-600">
                Here's what's happening with your inventory management system today.
              </p>
            </div>

            {/* Employee Details Card */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Employee Profile</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Employee ID</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser?.EmployeeID ? String(currentUser.EmployeeID).padStart(3, '0') : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Username</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser?.UserName || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{currentUser?.Email || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser?.Phone ? currentUser.Phone.replace(/^\+1/, '0') : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Role</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser?.RoleID ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getRoleName(currentUser.RoleID)}
                        </span>
                      ) : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Role Description</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser?.RoleID ? getRoleDescription(currentUser.RoleID) : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Account Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser?.CreatedDate ? 
                        new Date(currentUser.CreatedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created By</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentUser?.CreatedBy ? 
                        (currentUser.CreatedBy === 1 && currentUser.EmployeeID === 1 ? 'System' : `Employee ${currentUser.CreatedBy}`) 
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">Dashboard content will go here</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-gray-900">0</span>
                  <span className="text-sm text-gray-500 ml-1">Total Items</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">Recent activities will be displayed here</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-gray-900">0</span>
                  <span className="text-sm text-gray-500 ml-1">Recent Actions</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h5c0-5.523 4.477-10 10-10v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2c5.523 0 10 4.477 10 10z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">System notifications will appear here</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-gray-900">0</span>
                  <span className="text-sm text-gray-500 ml-1">Alerts</span>
                </div>
              </div>
            </div>

            {/* Additional Action Cards */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200">
                    <span className="font-medium text-gray-900">Add New Item</span>
                    <p className="text-sm text-gray-500">Add a new item to inventory</p>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200">
                    <span className="font-medium text-gray-900">Generate Report</span>
                    <p className="text-sm text-gray-500">Create inventory reports</p>
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                    <span className="text-sm font-medium text-gray-900">Database</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Online</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                    <span className="text-sm font-medium text-gray-900">API Services</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}