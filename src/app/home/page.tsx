// 'use client'

// import React, { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import Login from '@/components/login/login'
// import Sidebar from '@/components/Admin/sidebar'
// import Navbar from '@/components/Common/navbar'
// import { Employee } from '@/types/user'
// import { getCurrentUser, logoutUser } from '@/lib/auth'

// export default function HomePage() {
//   const router = useRouter()
//   const [isLoggedIn, setIsLoggedIn] = useState(false)
//   const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//   const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

//   useEffect(() => {
//     // Check for existing session
//     const checkAuth = async () => {
//       try {
//         const user = await getCurrentUser()
//         if (user) {
//           setCurrentUser(user)
//           setIsLoggedIn(true)
//         }
//       } catch (error) {
//         console.error('Auth check failed:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     checkAuth()
//   }, [])

//   const handleLogin = (user: Omit<Employee, 'Password'>) => {
//     setCurrentUser(user)
//     setIsLoggedIn(true)
//   }

//   const handleLogout = async () => {
//     try {
//       await logoutUser()
//       setIsLoggedIn(false)
//       setCurrentUser(null)
//       router.push('/')
//     } catch (error) {
//       console.error('Logout failed:', error)
//     }
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
//                   <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
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






// 'use client'
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Navbar from '@/components/Common/navbar';
// import SidebarWrapper from '@/components/Common/SidebarWraper';
// import Login from '@/components/login/login';
// import { Employee, hasAdminAccess, isStockKeeper } from '@/types/user';
// import { getCurrentUser, logoutUser } from '@/lib/auth';

// export default function HomePage() {
//   const router = useRouter()
//   const [isLoggedIn, setIsLoggedIn] = useState(false)
//   const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//   const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

//   useEffect(() => {
//     // Check for existing session
//     const checkAuth = async () => {
//       try {
//         const user = await getCurrentUser()
//         if (user) {
//           setCurrentUser(user)
//           setIsLoggedIn(true)
//         }
//       } catch (error) {
//         console.error('Auth check failed:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     checkAuth()
//   }, [])

//   const handleLogin = (user: Omit<Employee, 'Password'>) => {
//     setCurrentUser(user)
//     setIsLoggedIn(true)
//   }

//   const handleLogout = async () => {
//     try {
//       await logoutUser()
//       setIsLoggedIn(false)
//       setCurrentUser(null)
//       router.push('/')
//     } catch (error) {
//       console.error('Logout failed:', error)
//     }
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

//       {/* Role-based Sidebar - Below navbar */}
//       <SidebarWrapper
//         currentUser={currentUser}
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
//                 <h3 className="text-lg font-medium text-gray-900">Your Profile</h3>
//               </div>
//               <div className="px-6 py-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   <div>
//                     <p className="text-sm font-medium text-gray-500">Role</p>
//                     <p className="mt-1 text-sm text-gray-900">
//                       {getRoleName(currentUser?.RoleID || 0)}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-gray-500">Email</p>
//                     <p className="mt-1 text-sm text-gray-900">{currentUser?.Email}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-gray-500">Employee ID</p>
//                     <p className="mt-1 text-sm text-gray-900">
//                       {String(currentUser?.EmployeeID || 0).padStart(3, '0')}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Role-based Dashboard Content */}
//             {hasAdminAccess(currentUser?.RoleID || 0) && (
//               <div className="mb-6">
//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                   <h4 className="text-lg font-medium text-blue-900 mb-2">Admin Dashboard</h4>
//                   <p className="text-blue-700">
//                     You have administrative access to manage employees, inventory, and system settings.
//                   </p>
//                 </div>
//               </div>
//             )}

//             {isStockKeeper(currentUser?.RoleID || 0) && (
//               <div className="mb-6">
//                 <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                   <h4 className="text-lg font-medium text-green-900 mb-2">Stock Management</h4>
//                   <p className="text-green-700">
//                     Access inventory tracking, stock updates, and item management tools.
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Dashboard Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {/* Add your dashboard cards here */}
//             </div>

//             {/* Additional content based on role */}
//             <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Add role-specific content here */}
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }





'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Common/navbar';
import SidebarWrapper from '@/components/Common/SidebarWraper';
import Login from '@/components/login/login';
import { Employee, hasAdminAccess, isStockKeeper } from '@/types/user';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { fetchDashboardData, approveReturn, DashboardData } from '@/lib/services/homeService';
import { ReturnResponse } from '@/types/return';
import { CheckCircle, Clock, XCircle, Eye, AlertCircle } from 'lucide-react';

export default function HomePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  
  // Dashboard data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [isApprovingReturn, setIsApprovingReturn] = useState<number | null>(null)
  
  // View Return Details states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingReturn, setViewingReturn] = useState<ReturnResponse | null>(null)

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setCurrentUser(user)
          setIsLoggedIn(true)
          // Load dashboard data after authentication
          await loadDashboardData()
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoadingDashboard(true)
      setDashboardError(null)
      
      const data = await fetchDashboardData()
      setDashboardData(data)
      
      console.log(' Dashboard data loaded:', data)
    } catch (error) {
      console.error(' Error loading dashboard data:', error)
      setDashboardError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setIsLoadingDashboard(false)
    }
  }

  // Handle approve return
  const handleApproveReturn = async (returnId: number) => {
    try {
      setIsApprovingReturn(returnId)
      
      await approveReturn(returnId)
      
      // Refresh dashboard data to update the pending returns list
      await loadDashboardData()
      
      alert('Return approved successfully!')
      
    } catch (error) {
      console.error(' Error approving return:', error)
      alert(`Failed to approve return: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsApprovingReturn(null)
    }
  }

  // Handle view return details
  const handleViewReturn = (returnItem: ReturnResponse) => {
    setViewingReturn(returnItem)
    setIsViewModalOpen(true)
  }

  // Handle close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setViewingReturn(null)
  }

  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
    // Load dashboard data after login
    loadDashboardData()
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      setIsLoggedIn(false)
      setCurrentUser(null)
      setDashboardData(null)
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

  // Helper function to get return type name
  const getReturnTypeName = (returnType: string | null): string => {
    if (!returnType) return 'N/A';
    switch (returnType) {
      case 'SUPPLIER_RETURN': return 'Supplier Return';
      case 'DAMAGED_RETURN': return 'Damaged Return';
      case 'DEFECTIVE_RETURN': return 'Defective Return';
      case 'OTHER': return 'Other';
      default: return returnType;
    }
  }

  // Helper function to get product display name
  const getProductDisplayName = (productName: string, productSku?: string | null): string => { // add null option to productSku
    if (productSku) {
      return `${productName} (${productSku})`;
    }
    return productName || 'Unnamed Product';
  }

  // Helper function to get variation display name
  const getVariationDisplayName = (detail: any): string => {
    let displayName = detail.variationName || 'Unknown Variation';
    
    const details = [];
    if (detail.variationColor) details.push(`Color: ${detail.variationColor}`);
    if (detail.variationSize) details.push(`Size: ${detail.variationSize}`);
    if (detail.variationCapacity) details.push(`Capacity: ${detail.variationCapacity}`);
    
    if (details.length > 0) {
      displayName += ` (${details.join(', ')})`;
    }
    
    return displayName;
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

      {/* Role-based Sidebar - Below navbar */}
      <SidebarWrapper
        currentUser={currentUser}
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
                Welcome , {currentUser?.UserName}!
              </h1>
              {/* <p className="text-gray-600">
                Here's what's happening with your inventory management system today.
              </p> */}
            </div>

            {/* Employee Details Card */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Profile</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {getRoleName(currentUser?.RoleID || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1 text-sm text-gray-900">{currentUser?.Email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Employee ID</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {String(currentUser?.EmployeeID || 0).padStart(3, '0')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Statistics Cards */}
            {dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Total Returns</h3>
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-900">{dashboardData.statistics.totalReturns}</span>
                    <span className="text-sm text-gray-500 ml-1">Total Returns</span>
                  </div>
                </div> */}

                {/* <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Pending Returns</h3>
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-yellow-600">{dashboardData.statistics.pendingReturns}</span>
                    <span className="text-sm text-gray-500 ml-1">Awaiting Approval</span>
                  </div>
                </div> */}

                {/* <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Approved Returns</h3>
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-green-600">{dashboardData.statistics.approvedReturns}</span>
                    <span className="text-sm text-gray-500 ml-1">Approved</span>
                  </div>
                </div> */}

                {/* <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Rejected Returns</h3>
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-red-600">{dashboardData.statistics.rejectedReturns}</span>
                    <span className="text-sm text-gray-500 ml-1">Rejected</span>
                  </div>
                </div> */}
              </div>
            )}

            {/* Role-based Dashboard Content */}
            {hasAdminAccess(currentUser?.RoleID || 0) && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-blue-900 mb-2">Admin Dashboard</h4>
                  <p className="text-blue-700">
                    You have administrative access to manage employees, inventory, and system settings.
                  </p>
                </div>
              </div>
            )}

            {/* Pending Returns Section */}
            {dashboardData && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Pending Returns ({dashboardData.statistics.pendingReturns})
                    </h3>
                    <button
                      onClick={loadDashboardData}
                      disabled={isLoadingDashboard}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {isLoadingDashboard ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  {isLoadingDashboard ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-gray-500">Loading pending returns...</span>
                    </div>
                  ) : dashboardError ? (
                    <div className="text-center py-8">
                      <div className="text-red-400 text-xl mb-4"></div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                      <p className="text-gray-500 mb-4">{dashboardError}</p>
                      <button
                        onClick={loadDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : dashboardData.pendingReturns.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-xl mb-4"></div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Returns</h3>
                      <p className="text-gray-500">All returns have been processed!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.pendingReturns.map((returnItem) => (
                        <div key={returnItem.returnId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">
                                    Return ID: {String(returnItem.returnId).padStart(3, '0')}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Return Number: {returnItem.returnNumber}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {returnItem.supplier.supplierName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Supplier ID: {String(returnItem.supplier.supplierId).padStart(4, '0')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Type: {getReturnTypeName(returnItem.returnType)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Date: {returnItem.returnDate ? new Date(returnItem.returnDate).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Items: {returnItem.details.length}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Total Qty: {returnItem.details.reduce((total, detail) => total + (detail.quantityReturned || 0), 0)}
                                  </p>
                                </div>
                              </div>
                              {returnItem.reason && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <span className="font-medium">Reason:</span> {returnItem.reason}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleViewReturn(returnItem)}
                                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                              >
                                <Eye size={14} />
                                View
                              </button>
                              
                              <button
                                onClick={() => handleApproveReturn(returnItem.returnId)}
                                disabled={isApprovingReturn === returnItem.returnId}
                                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isApprovingReturn === returnItem.returnId ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={14} />
                                    Approve
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isStockKeeper(currentUser?.RoleID || 0) && (
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-green-900 mb-2">Stock Management</h4>
                  <p className="text-green-700">
                    Access inventory tracking, stock updates, and item management tools.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* View Return Details Modal */}
      {isViewModalOpen && viewingReturn && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseViewModal}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Return Details</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Return ID: {String(viewingReturn.returnId).padStart(3, '0')} • 
                        Supplier: {viewingReturn.supplier?.supplierName} • 
                        Date: {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={handleCloseViewModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  <div className="space-y-6">
                    {/* Return Summary */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Return Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Return ID</label>
                          <p className="text-sm text-gray-900 font-medium">
                            {String(viewingReturn.returnId).padStart(3, '0')}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Return Number</label>
                          <p className="text-sm text-gray-900 font-medium">
                            {viewingReturn.returnNumber}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                          <p className="text-sm text-gray-900">
                            {viewingReturn.supplier?.supplierName}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                          <p className="text-sm text-gray-900">
                            {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
                          <p className="text-sm text-gray-900">
                            {getReturnTypeName(viewingReturn.returnType)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            viewingReturn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            viewingReturn.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            viewingReturn.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {viewingReturn.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stockkeeper</label>
                          <p className="text-sm text-gray-900">
                            {viewingReturn.employee?.userName || `ID: ${String(viewingReturn.returnedBy).padStart(4, '0')}`}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                          <p className="text-sm text-gray-900">{viewingReturn.reason || 'N/A'}</p>
                        </div>
                        {viewingReturn.remarks && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                            <p className="text-sm text-gray-900">{viewingReturn.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Return Product Details Table */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Return Product Details ({viewingReturn.details.length} {viewingReturn.details.length === 1 ? 'item' : 'items'})
                      </h3>
                      
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Return Product ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Product Information
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Variation Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {viewingReturn.details.map((detail, index) => (
                                <tr key={detail.returnProductId || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {String(detail.returnProductId || 'N/A').padStart(4, '0')}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm">
                                      <div className="font-medium text-gray-900">
                                        {getProductDisplayName(detail.productName || 'Unknown Product', detail.productSku)}
                                      </div>
                                      <div className="text-gray-500 mt-1">
                                        Product ID: {detail.productId || 'N/A'}
                                      </div>
                                      {detail.brandName && (
                                        <div className="text-gray-500">
                                          Brand: {detail.brandName}
                                        </div>
                                      )}
                                      {detail.categoryName && (
                                        <div className="text-gray-500">
                                          Category: {detail.categoryName}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm">
                                      <div className="font-medium text-gray-900">
                                        {getVariationDisplayName(detail)}
                                      </div>
                                      <div className="text-gray-500 mt-1">
                                        Variation ID: {String(detail.variationId || 'N/A').padStart(3, '0')}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {(detail.quantityReturned || 0).toLocaleString()}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">
                                      {detail.remarks || 'No remarks'}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                              <tr>
                                <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                  Total Items Returned:
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-bold text-gray-900">
                                    {viewingReturn.details.reduce((total, detail) => total + (detail.quantityReturned || 0), 0).toLocaleString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                  <div>
                    {viewingReturn.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          handleApproveReturn(viewingReturn.returnId);
                          handleCloseViewModal();
                        }}
                        disabled={isApprovingReturn === viewingReturn.returnId}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isApprovingReturn === viewingReturn.returnId ? 'Approving...' : 'Approve Return'}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleCloseViewModal}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}