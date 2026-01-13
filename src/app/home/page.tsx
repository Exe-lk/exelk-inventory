'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Common/navbar';
import SidebarWrapper from '@/components/Common/SidebarWraper';
import Login from '@/components/login/login';
import { Employee, hasAdminAccess, isStockKeeper } from '@/types/user';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { fetchDashboardData, approveReturn, DashboardData, clearDashboardCache } from '@/lib/services/homeService';
import { ReturnResponse } from '@/types/return';
import { CheckCircle, Clock, XCircle, Eye, AlertCircle,AlertTriangle, Package, ExternalLink, HelpCircle } from 'lucide-react';
import Tooltip from '@/components/Common/Tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePageTitle } from '@/lib/hooks/usePageTitle';


// Add new interface after existing interfaces
interface LowStockItem {
  stockId: number;
  productId: number;
  productName: string;
  productSku?: string;
  brandName?: string;
  categoryName?: string;
  variationId: number | null;
  variationName?: string;
  variationColor?: string;
  variationSize?: string;
  variationCapacity?: string;
  quantityAvailable: number;
  reorderLevel: number;
  location?: string;
  lastUpdatedDate: string;
}

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

  // Add state for low stock modal
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false)
  const [isNavigatingToStock, setIsNavigatingToStock] = useState(false)
  usePageTitle('Dashboard');

  // Add helper function for getting variation display name
  const getVariationDisplayName = (item: LowStockItem): string => {
    if (!item.variationName) return 'No Variation';
    
    let displayName = item.variationName;
    const details = [];
    
    if (item.variationColor) details.push(`Color: ${item.variationColor}`);
    if (item.variationSize) details.push(`Size: ${item.variationSize}`);
    if (item.variationCapacity) details.push(`Capacity: ${item.variationCapacity}`);
    
    if (details.length > 0) {
      displayName += ` (${details.join(', ')})`;
    }
    
    return displayName;
  };

  // Add helper function for getting product display name
  const getProductDisplayName = (item: LowStockItem): string => {
    let displayName = item.productName;
    if (item.productSku) {
      displayName += ` (${item.productSku})`;
    }
    return displayName;
  };

  // Add handler for viewing low stock details
  const handleViewLowStock = () => {
    setIsLowStockModalOpen(true);
  };

  const handleCloseLowStockModal = () => {
    setIsLowStockModalOpen(false);
  };

  // Add handler for navigating to stock page
  const handleNavigateToStock = async () => {
    setIsNavigatingToStock(true);
    router.push('/stock');
  };

 
const [userCache, setUserCache] = useState<Omit<Employee, 'Password'> | null>(null)




// Update the useEffect hook (around line 123)
// useEffect(() => {
//   const checkAuth = async () => {
//     try {
//       // Try to load cached dashboard data first for instant display
//       try {
//         const cached = sessionStorage.getItem('dashboard_data_cache');
//         if (cached) {
//           const { data, timestamp } = JSON.parse(cached);
//           // Show cached data immediately if available (even if expired)
//           if (data) {
//             setDashboardData(data);
//             if (data.user) {
//               setCurrentUser(data.user);
//               setUserCache(data.user);
//               setIsLoggedIn(true);
//             }
//           }
//         }
//       } catch (cacheError) {
//         // Ignore cache errors, continue with normal flow
//         console.warn('Cache read error:', cacheError);
//       }
      
//       // Load dashboard data (will use cache if valid, or fetch fresh)
//       const data = await fetchDashboardData();
      
//       if (data.user) {
//         setCurrentUser(data.user);
//         setUserCache(data.user);
//         setIsLoggedIn(true);
//         setDashboardData(data);
//       } else {
//         // Fallback: if dashboard doesn't have user, try getCurrentUser
//         const user = await getCurrentUser();
//         if (user) {
//           setCurrentUser(user);
//           setUserCache(user);
//           setIsLoggedIn(true);
//           await loadDashboardData();
//         }
//       }
//     } catch (error) {
//       console.error('Auth check failed:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   }

//   checkAuth()
// }, [])



// ... existing imports ...

// Update the useEffect hook (around line 200)
useEffect(() => {
  let isMounted = true // Prevent state updates after unmount
  
  const checkAuth = async () => {
    try {
      // Try to load cached dashboard data first for instant display
      try {
        const cached = sessionStorage.getItem('dashboard_data_cache');
        if (cached && isMounted) {
          const { data, timestamp } = JSON.parse(cached);
          // Show cached data immediately if available (even if expired)
          if (data) {
            setDashboardData(data);
            if (data.user) {
              setCurrentUser(data.user);
              setUserCache(data.user);
              setIsLoggedIn(true);
            }
          }
        }
      } catch (cacheError) {
        // Ignore cache errors, continue with normal flow
        console.warn('Cache read error:', cacheError);
      }
      
      // Load dashboard data (will use cache if valid, or fetch fresh)
      const data = await fetchDashboardData();
      
      if (!isMounted) return // Don't update state if component unmounted
      
      if (data.user) {
        setCurrentUser(data.user);
        setUserCache(data.user);
        setIsLoggedIn(true);
        setDashboardData(data);
      } else {
        // Fallback: if dashboard doesn't have user, try getCurrentUser
        const user = await getCurrentUser();
        if (user && isMounted) {
          setCurrentUser(user);
          setUserCache(user);
          setIsLoggedIn(true);
          await loadDashboardData();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (isMounted) {
        setIsLoggedIn(false);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  checkAuth()
  
  // Cleanup function
  return () => {
    isMounted = false
  }
}, [])

// ... rest of the code ...



// Update loadDashboardData function (around line 155)
const loadDashboardData = async () => {
  try {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    
    // This will use cache if valid, or fetch fresh data
    const data = await fetchDashboardData();

    if (data.user && !currentUser) {
      setCurrentUser(data.user);
    }

    setDashboardData(data);
    
    console.log(' Dashboard data loaded:', data);
  } catch (error) {
    console.error(' Error loading dashboard data:', error);
    setDashboardError(error instanceof Error ? error.message : 'Failed to load dashboard data');
  } finally {
    setIsLoadingDashboard(false);
  }
}

// Update handleApproveReturn to clear cache after approval (around line 178)
const handleApproveReturn = async (returnId: number) => {
  try {
    setIsApprovingReturn(returnId);
    
    await approveReturn(returnId);
    
    // Clear cache before refreshing to ensure fresh data
    // Import clearDashboardCache at the top if not already imported
    const { clearDashboardCache } = await import('@/lib/services/homeService');
    clearDashboardCache();
    
    // Refresh dashboard data to update the pending returns list
    await loadDashboardData();
    
    alert('Return approved successfully!');
    
  } catch (error) {
    console.error(' Error approving return:', error);
    alert(`Failed to approve return: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setIsApprovingReturn(null);
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

  // Helper function to get product display name for returns
  const getReturnProductDisplayName = (productName: string, productSku?: string | null): string => { // add null option to productSku
    if (productSku) {
      return `${productName} (${productSku})`;
    }
    return productName || 'Unnamed Product';
  }

  // Helper function to get variation display name for returns
  const getReturnVariationDisplayName = (detail: any): string => {
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
            {/* <div className="bg-white shadow rounded-lg mb-6">
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
            </div> */}

            
            {/* Dashboard Statistics Cards - Reorganized into 2 cards */}
{dashboardData && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    {/* Returns Section Card */}
    <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Returns Overview</h3>
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4 text-blue-600" />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {/* Total Returns */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-3 h-3 text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{dashboardData.statistics.totalReturns}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Returns</p>
        </div>

        {/* Pending Returns */}
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-3 h-3 text-yellow-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-yellow-600">{dashboardData.statistics.pendingReturns}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending</p>
        </div>

        {/* Approved Returns */}
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-green-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-green-600">{dashboardData.statistics.approvedReturns}</p>
          <p className="text-xs text-gray-500 mt-0.5">Approved</p>
        </div>
      </div>
    </div>

    {/* Stock Section Card */}
    <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Package className="w-4 h-4 text-orange-600" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Low Stock Items */}
        <div 
          className="text-center p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
          onClick={handleViewLowStock}
        >
          <div className="flex items-center justify-center mb-1">
            <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-orange-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-orange-600">{dashboardData.statistics.totalLowStockItems}</p>
          <p className="text-xs text-gray-500 mt-0.5">Low Stock Items</p>
          {dashboardData.statistics.outOfStockItems > 0 && (
            <p className="text-xs text-red-600 mt-0.5 font-medium">
              {dashboardData.statistics.outOfStockItems} Out of Stock
            </p>
          )}
        </div>

        {/* Out of Stock - No click handler */}
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
              <Package className="w-3 h-3 text-red-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-600">{dashboardData.statistics.outOfStockItems}</p>
          <p className="text-xs text-gray-500 mt-0.5">Out of Stock</p>
          <p className="text-xs text-gray-400 mt-0.5">Critical</p>
        </div>
      </div>
    </div>
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
                            {/* // Return Summary starts here */}
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">
                                    Return Number: {returnItem.returnNumber}
                                  </h4>
                                  {/* <p className="text-sm text-gray-500">
                                    Return Number: {returnItem.returnNumber}
                                  </p> */}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Supplier ID: {String(returnItem.supplier.supplierId).padStart(4, '0')}
                                  </p>
                                  {/* <p className="text-sm text-gray-500">
                                    Supplier ID: {String(returnItem.supplier.supplierId).padStart(4, '0')}
                                  </p> */}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Type: {getReturnTypeName(returnItem.returnType)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Date: {returnItem.returnDate ? new Date(returnItem.returnDate).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  {/* <p className="text-sm text-gray-500">
                                    Items: {returnItem.details.length}
                                  </p> */}
                                  <p className="text-sm font-medium text-gray-900">
                                    Total Qty: {returnItem.details.reduce((total, detail) => total + (detail.quantityReturned || 0), 0)}
                                  </p>
                                </div>
                                <div>
                                  {returnItem.reason && (
                                <p className="text-sm font-medium text-gray-900">
                                  <span className="font-medium">Reason:</span> {returnItem.reason}
                                </p>
                              )}
                                </div>
                              </div>
                              {/* {returnItem.reason && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <span className="font-medium">Reason:</span> {returnItem.reason}
                                </p>
                              )} */}
                            </div>
                            {/* // Return Actions starts here */}
                            
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleViewReturn(returnItem)}
                                title="View Return Details"
                                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                              >
                                <Eye size={14} />
                                
                              </button>
                              
                              <button
                                onClick={() => handleApproveReturn(returnItem.returnId)}
                                title="Approve Return"
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



            
{/* Stock Value Analytics - Combined Section */}
{dashboardData?.stockValueAnalytics && (
  <div className="bg-white shadow rounded-lg mb-6">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-gray-900">Inventory Value Analytics</h3>
          <Tooltip
            title="Inventory Value Analytics"
            description="This section provides a comprehensive overview of your inventory's total value, broken down by categories, brands, and time periods. All values are calculated based on the latest unit costs from GRN (Goods Receipt Notes) or product variation prices."
            position="top"
          />
        </div>
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-purple-600" />
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-1">Comprehensive overview of your inventory value</p>
    </div>

    <div className="px-6 py-6">
      {/* Key Metrics - Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Inventory Value */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-purple-700 uppercase tracking-wide">Total Inventory Value</h4>
              <Tooltip
                title="Total Inventory Value"
                description="The total monetary value of all products currently in stock. This represents the sum of all inventory items multiplied by their unit costs."
                formula="Σ (Quantity Available × Unit Cost) for all products"
                example="If you have 100 units at LKR 50 each and 200 units at LKR 30 each, Total Value = (100 × 50) + (200 × 30) = LKR 11,000"
                position="top"
              />
            </div>
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-purple-900">
              LKR {dashboardData.stockValueAnalytics.totalInventoryValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            <p className="text-sm text-purple-600 mt-2">
              Across {dashboardData.stockValueAnalytics.totalProducts} {dashboardData.stockValueAnalytics.totalProducts === 1 ? 'product' : 'products'}
            </p>
          </div>
        </div>

        {/* Average Value Per Product */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-indigo-700 uppercase tracking-wide">Average Value Per Product</h4>
              <Tooltip
                title="Average Value Per Product"
                description="The average monetary value per product in your inventory. This helps you understand the typical value of a single product in your stock."
                formula="Total Inventory Value ÷ Number of Unique Products"
                example="If Total Value is LKR 100,000 and you have 50 unique products, Average = 100,000 ÷ 50 = LKR 2,000 per product"
                position="top"
              />
            </div>
            <AlertCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-indigo-900">
              LKR {dashboardData.stockValueAnalytics.averageStockValuePerProduct.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            <p className="text-sm text-indigo-600 mt-2">
              Per product average
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Section - Category & Brand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By Category */}
        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">By Category</h4>
              <Tooltip
                title="Inventory Value by Category"
                description="Shows the total inventory value grouped by product categories. This helps you identify which categories hold the most value in your inventory."
                formula="For each category: Σ (Quantity × Unit Cost) of all products in that category"
                example="Electronics category: 50 units × LKR 100 = LKR 5,000. Clothing category: 100 units × LKR 30 = LKR 3,000"
                position="top"
              />
            </div>
          </div>
          {dashboardData.stockValueAnalytics.inventoryValueByCategory.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.stockValueAnalytics.inventoryValueByCategory.slice(0, 5).map((category, index) => (
                <div key={category.categoryId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center flex-1">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-purple-500' : 'bg-gray-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{category.categoryName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{category.percentage.toFixed(1)}% of total value</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-gray-900">
                      LKR {category.value.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {dashboardData.stockValueAnalytics.inventoryValueByCategory.length > 5 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  +{dashboardData.stockValueAnalytics.inventoryValueByCategory.length - 5} more categories
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No category data available</p>
            </div>
          )}
        </div>

        {/* By Brand */}
        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Package className="w-4 h-4 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">By Brand</h4>
              <Tooltip
                title="Inventory Value by Brand"
                description="Shows the total inventory value grouped by product brands. This helps you identify which brands represent the most value in your inventory."
                formula="For each brand: Σ (Quantity × Unit Cost) of all products from that brand"
                example="Brand A: 75 units × LKR 80 = LKR 6,000. Brand B: 120 units × LKR 25 = LKR 3,000"
                position="top"
              />
            </div>
          </div>
          {dashboardData.stockValueAnalytics.inventoryValueByBrand.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.stockValueAnalytics.inventoryValueByBrand.slice(0, 5).map((brand, index) => (
                <div key={brand.brandId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center flex-1">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-purple-500' : 'bg-gray-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{brand.brandName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{brand.percentage.toFixed(1)}% of total value</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-gray-900">
                      LKR {brand.value.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {dashboardData.stockValueAnalytics.inventoryValueByBrand.length > 5 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  +{dashboardData.stockValueAnalytics.inventoryValueByBrand.length - 5} more brands
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No brand data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Value Trends Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold text-gray-900">Value Trends</h4>
            <Tooltip
              title="Inventory Value Trends"
              description="Shows the inventory value over different time periods. Currently displays the current inventory value. Historical tracking can be added to show actual trends over time."
              position="top"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-blue-700">Last 30 Days</p>
                <Tooltip
                  title="30-Day Inventory Value"
                  description="The total inventory value calculated for the last 30 days. Currently shows the current value. This metric helps track inventory value changes over a monthly period."
                  formula="Current: Σ (Current Quantity × Latest Unit Cost). Historical: Would track value at 30 days ago"
                  example="If tracking historical data, this would show the inventory value from 30 days ago for comparison"
                  position="top"
                />
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              LKR {dashboardData.stockValueAnalytics.inventoryValueTrend.last30Days.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            <p className="text-xs text-blue-600 mt-1">30-day inventory value</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-green-700">Last 90 Days</p>
                <Tooltip
                  title="90-Day Inventory Value"
                  description="The total inventory value calculated for the last 90 days. Currently shows the current value. This metric helps track inventory value changes over a quarterly period."
                  formula="Current: Σ (Current Quantity × Latest Unit Cost). Historical: Would track value at 90 days ago"
                  example="If tracking historical data, this would show the inventory value from 90 days ago for comparison"
                  position="top"
                />
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-green-900">
              LKR {dashboardData.stockValueAnalytics.inventoryValueTrend.last90Days.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            <p className="text-xs text-green-600 mt-1">90-day inventory value</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}




{/* GRN Analytics Section */}
{dashboardData?.grnAnalytics && (
  <div className="bg-white shadow rounded-lg mb-6">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-gray-900">GRN (Goods Receipt) Analytics</h3>
          <Tooltip
            title="GRN Analytics"
            description="Comprehensive analytics for Goods Receipt Notes (GRN), showing monthly totals, trends, and average values over time."
            position="bottom"
          />
        </div>
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </div>

    <div className="px-6 py-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total GRNs This Month vs Last Month */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total GRNs</h4>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-900">
                {dashboardData.grnAnalytics.totalGRNsThisMonth}
              </p>
              <span className="text-sm text-blue-600">This Month</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {dashboardData.grnAnalytics.totalGRNsThisMonth > dashboardData.grnAnalytics.totalGRNsLastMonth ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : dashboardData.grnAnalytics.totalGRNsThisMonth < dashboardData.grnAnalytics.totalGRNsLastMonth ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <Minus className="w-4 h-4 text-gray-600" />
              )}
              <p className="text-sm text-blue-600">
                Last Month: {dashboardData.grnAnalytics.totalGRNsLastMonth}
              </p>
            </div>
          </div>
        </div>

        {/* Total Value This Month */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-green-700 uppercase tracking-wide">Total Value This Month</h4>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-green-900">
              LKR {dashboardData.grnAnalytics.totalValueThisMonth.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {dashboardData.grnAnalytics.totalValueThisMonth > dashboardData.grnAnalytics.totalValueLastMonth ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : dashboardData.grnAnalytics.totalValueThisMonth < dashboardData.grnAnalytics.totalValueLastMonth ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <Minus className="w-4 h-4 text-gray-600" />
              )}
              <p className="text-sm text-green-600">
                Last Month: LKR {dashboardData.grnAnalytics.totalValueLastMonth.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Average GRN Value */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-purple-700 uppercase tracking-wide">Average GRN Value</h4>
            <AlertCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-purple-900">
              LKR {dashboardData.grnAnalytics.averageGRNValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            <p className="text-sm text-purple-600 mt-2">
              Across all GRNs
            </p>
          </div>
        </div>
      </div>

      {/* GRN Value Trend Chart */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold text-gray-900">GRN Value Trend (Last 30 Days)</h4>
            <Tooltip
              title="GRN Value Trend"
              description="Shows the daily total value of GRNs received over the last 30 days. Helps identify patterns and trends in goods receipt."
              position="bottom"
            />
          </div>
        </div>
        
        {dashboardData.grnAnalytics.grnValueTrend.length > 0 ? (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dashboardData.grnAnalytics.grnValueTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `LKR ${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `LKR ${(value / 1000).toFixed(1)}K`;
                    return `LKR ${value}`;
                  }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number | undefined) => [
                    `LKR ${(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    'Value'
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="GRN Value (LKR)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No GRN data available for the last 30 days</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}




{/* GIN Analytics Section */}
{dashboardData?.ginAnalytics && (
  <div className="bg-white shadow rounded-lg mb-6">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-gray-900">GIN (Goods Issue) Analytics</h3>
          <Tooltip
            title="GIN Analytics"
            description="Comprehensive analytics for Goods Issue Notes (GIN), showing monthly totals, quantities issued, and trends over time."
            position="bottom"
          />
        </div>
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-orange-600" />
        </div>
      </div>
    </div>

    <div className="px-6 py-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total GINs This Month vs Last Month */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-orange-700 uppercase tracking-wide">Total GINs</h4>
            <Package className="w-5 h-5 text-orange-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-orange-900">
                {dashboardData.ginAnalytics.totalGINsThisMonth}
              </p>
              <span className="text-sm text-orange-600">This Month</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {dashboardData.ginAnalytics.totalGINsThisMonth > dashboardData.ginAnalytics.totalGINsLastMonth ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : dashboardData.ginAnalytics.totalGINsThisMonth < dashboardData.ginAnalytics.totalGINsLastMonth ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <Minus className="w-4 h-4 text-gray-600" />
              )}
              <p className="text-sm text-orange-600">
                Last Month: {dashboardData.ginAnalytics.totalGINsLastMonth}
              </p>
            </div>
          </div>
        </div>

        {/* Total Quantity Issued This Month */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-red-700 uppercase tracking-wide">Total Quantity Issued</h4>
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-red-900">
              {dashboardData.ginAnalytics.totalQuantityIssuedThisMonth.toLocaleString('en-US')}
            </p>
            <span className="text-sm text-red-600">Units This Month</span>
            <div className="flex items-center gap-2 mt-2">
              {dashboardData.ginAnalytics.totalQuantityIssuedThisMonth > dashboardData.ginAnalytics.totalQuantityIssuedLastMonth ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : dashboardData.ginAnalytics.totalQuantityIssuedThisMonth < dashboardData.ginAnalytics.totalQuantityIssuedLastMonth ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <Minus className="w-4 h-4 text-gray-600" />
              )}
              <p className="text-sm text-red-600">
                Last Month: {dashboardData.ginAnalytics.totalQuantityIssuedLastMonth.toLocaleString('en-US')}
              </p>
            </div>
          </div>
        </div>

        {/* Average GIN Value */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-amber-700 uppercase tracking-wide">Average GIN Value</h4>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-amber-900">
              LKR {dashboardData.ginAnalytics.averageGINValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            <p className="text-sm text-amber-600 mt-2">
              Per GIN average
            </p>
          </div>
        </div>
      </div>

      {/* Quantity Issued Trend Chart */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold text-gray-900">Quantity Issued Trend (Last 30 Days)</h4>
            <Tooltip
              title="Quantity Issued Trend"
              description="Shows the daily total quantity of items issued through GINs over the last 30 days. Helps identify patterns in goods issuance."
              position="bottom"
            />
          </div>
        </div>
        
        {dashboardData.ginAnalytics.quantityIssuedTrend.length > 0 ? (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dashboardData.ginAnalytics.quantityIssuedTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: number) => {
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                    return `${value}`;
                  }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number | undefined) => [
                    `${(value ?? 0).toLocaleString('en-US')} units`,
                    'Quantity'
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="quantity" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Quantity Issued (Units)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No GIN data available for the last 30 days</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}






            {/* {isStockKeeper(currentUser?.RoleID || 0) && (
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-green-900 mb-2">Stock Management</h4>
                  <p className="text-green-700">
                    Access inventory tracking, stock updates, and item management tools.
                  </p>
                </div>
              </div>
            )} */}
          </div>
        </main>
      </div>

      {/* Add the Low Stock Modal at the end of your component, just before the closing div */}
      {/* Low Stock Details Modal */}
      {isLowStockModalOpen && dashboardData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseLowStockModal}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Low Stock Items Details</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Items with stock levels at or below their reorder points
                      </p>
                    </div>
                    <button
                      onClick={handleCloseLowStockModal}
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
                  {dashboardData.lowStockItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-green-400 text-xl mb-4">✅</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">All Stock Levels Good!</h3>
                      <p className="text-gray-500">No items are currently below their reorder levels.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <AlertTriangle className="h-8 w-8 text-orange-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-orange-800">Low Stock Items</div>
                              <div className="text-2xl font-bold text-orange-900">{dashboardData.statistics.totalLowStockItems}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <Package className="h-8 w-8 text-red-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-red-800">Out of Stock</div>
                              <div className="text-2xl font-bold text-red-900">{dashboardData.statistics.outOfStockItems}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <Eye className="h-8 w-8 text-blue-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-blue-800">Showing Top</div>
                              <div className="text-2xl font-bold text-blue-900">{Math.min(10, dashboardData.lowStockItems.length)}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Low Stock Items Table */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Stock ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Product Information
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Variation Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Stock Levels
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {dashboardData.lowStockItems.map((item, index) => (
                                <tr key={item.stockId} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${item.quantityAvailable === 0 ? 'bg-red-50' : item.quantityAvailable <= item.reorderLevel ? 'bg-orange-50' : ''}`}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {String(item.stockId).padStart(3, '0')}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm">
                                      <div className="font-medium text-gray-900">
                                        {getProductDisplayName(item)}
                                      </div>
                                      <div className="text-gray-500 mt-1">
                                        Product ID: {item.productId}
                                      </div>
                                      {item.brandName && (
                                        <div className="text-gray-500">
                                          Brand: {item.brandName}
                                        </div>
                                      )}
                                      {item.categoryName && (
                                        <div className="text-gray-500">
                                          Category: {item.categoryName}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm">
                                      <div className="font-medium text-gray-900">
                                        {getVariationDisplayName(item)}
                                      </div>
                                      <div className="text-gray-500 mt-1">
                                        Variation ID: {String(item.variationId || 'N/A').padStart(3, '0')}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm">
                                      <div className={`font-bold ${item.quantityAvailable === 0 ? 'text-red-600' : item.quantityAvailable <= item.reorderLevel ? 'text-orange-600' : 'text-gray-900'}`}>
                                        Available: {item.quantityAvailable}
                                      </div>
                                      <div className="text-gray-500">
                                        Reorder Level: {item.reorderLevel}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {item.location || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      item.quantityAvailable === 0 ? 'bg-red-100 text-red-800' :
                                      item.quantityAvailable <= item.reorderLevel ? 'bg-orange-100 text-orange-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {item.quantityAvailable === 0 ? 'OUT OF STOCK' :
                                       item.quantityAvailable <= item.reorderLevel ? 'LOW STOCK' :
                                       'IN STOCK'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={handleNavigateToStock}
                    disabled={isNavigatingToStock}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isNavigatingToStock ? 'Loading...' : 'Go to Stock Management'}
                  </button>
                  <button
                    onClick={handleCloseLowStockModal}
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
                                        {getReturnProductDisplayName(detail.productName || 'Unknown Product', detail.productSku)}
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
                                        {getReturnVariationDisplayName(detail)}
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