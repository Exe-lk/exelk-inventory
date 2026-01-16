
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
import { CheckCircle, Clock, XCircle, Eye, AlertCircle, AlertTriangle, Package, ExternalLink, HelpCircle } from 'lucide-react';
import Tooltip from '@/components/Common/Tooltip';
// Update the import at the top (around line 14)
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-indigo-500 mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
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
        className={`pt-[70px] transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'
          }`}
      >
        {/* ------------------------------------------------------ */}

        <main className="overflow-y-auto bg-gray-50 dark:bg-slate-950 p-4" style={{ minHeight: 'calc(100vh - 70px)' }}>
          <div className="max-w-full">
            {/* Welcome Section */}
            <div className="mb-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome , {currentUser?.UserName}!
              </h1>
            </div>




            





            {/* Role-based Dashboard Content */}
            {hasAdminAccess(currentUser?.RoleID || 0) && (
              <div className="mb-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="text-base font-medium text-blue-900 dark:text-blue-300 mb-1">Admin Dashboard</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You have administrative access to manage employees, inventory, and system settings.
                  </p>
                </div>
              </div>
            )}

            {/* Pending Returns Section */}
           




            {/* Dashboard Statistics Cards - Combined Layout */}
            {dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Combined Returns Overview & Stock Alerts Card - Left Side */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                  {/* Returns Overview Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Returns Overview</h3>
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Total Returns */}
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                            <Clock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{dashboardData.statistics.totalReturns}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Returns</p>
                      </div>

                      {/* Pending Returns */}
                      <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-5 h-5 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-2.5 h-2.5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                        </div>
                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{dashboardData.statistics.pendingReturns}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pending</p>
                      </div>

                      {/* Approved Returns */}
                      <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-5 h-5 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{dashboardData.statistics.approvedReturns}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Approved</p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-slate-700 my-3"></div>

                  {/* Stock Alerts Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Stock Alerts</h3>
                      <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <Package className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Low Stock Items */}
                      <div
                        className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                        onClick={handleViewLowStock}
                      >
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-5 h-5 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" />
                          </div>
                        </div>
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{dashboardData.statistics.totalLowStockItems}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Low Stock Items</p>
                        {dashboardData.statistics.outOfStockItems > 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-medium">
                            {dashboardData.statistics.outOfStockItems} Out of Stock
                          </p>
                        )}
                      </div>

                      {/* Out of Stock */}
                      <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-5 h-5 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
                            <Package className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
                          </div>
                        </div>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{dashboardData.statistics.outOfStockItems}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Out of Stock</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Critical</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Returns Section - Right Side */}
                <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">
                        Pending Returns ({dashboardData.statistics.pendingReturns})
                      </h3>
                      <button
                        onClick={loadDashboardData}
                        disabled={isLoadingDashboard}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                      >
                        {isLoadingDashboard ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                  </div>

                  <div className="px-4 py-3 max-h-[600px] overflow-y-auto">
                    {isLoadingDashboard ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-indigo-500 mr-3"></div>
                        <span className="text-gray-500 dark:text-gray-400">Loading pending returns...</span>
                      </div>
                    ) : dashboardError ? (
                      <div className="text-center py-8">
                        <div className="text-red-400 text-xl mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Data</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{dashboardError}</p>
                        <button
                          onClick={loadDashboardData}
                          className="px-4 py-2 bg-blue-600 dark:bg-indigo-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-indigo-700"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : dashboardData.pendingReturns.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 dark:text-gray-500 text-xl mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Pending Returns</h3>
                        <p className="text-gray-500 dark:text-gray-400">All returns have been processed!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dashboardData.pendingReturns.map((returnItem) => (
                          <div key={returnItem.returnId} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                            <div className="flex items-center justify-between">
                              {/* Return Summary starts here */}
                              <div className="flex-1">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                      Return Number: {returnItem.returnNumber}
                                    </h4>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      Supplier ID: {String(returnItem.supplier.supplierId).padStart(4, '0')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      Type: {getReturnTypeName(returnItem.returnType)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      Date: {returnItem.returnDate ? new Date(returnItem.returnDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      Total Qty: {returnItem.details.reduce((total, detail) => total + (detail.quantityReturned || 0), 0)}
                                    </p>
                                  </div>
                                  <div>
                                    {returnItem.reason && (
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        <span className="font-medium">Reason:</span> {returnItem.reason}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Return Actions starts here */}

                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleViewReturn(returnItem)}
                                  title="View Return Details"
                                  className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                  <Eye size={14} />
                                </button>

                                <button
                                  onClick={() => handleApproveReturn(returnItem.returnId)}
                                  title="Approve Return"
                                  disabled={isApprovingReturn === returnItem.returnId}
                                  className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              </div>
            )}




            




            {/* Stock Value Analytics - Combined Section */}
            








            {/* Stock Value Analytics - Combined Section with Charts */}
            {/* Stock Value Analytics - Combined Section with Charts */}
            {dashboardData?.stockValueAnalytics && (
              <div className="bg-white dark:bg-slate-800 shadow rounded-lg mb-3">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Inventory Value Analytics</h3>
                      <Tooltip
                        title="Inventory Value Analytics"
                        description="This section provides a comprehensive overview of your inventory's total value, broken down by categories, brands, and time periods. All values are calculated based on the latest unit costs from GRN (Goods Receipt Notes) or product variation prices."
                        position="top"
                      />
                    </div>
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2">
                  {/* Key Metrics - Compact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    {/* Total Inventory Value */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 p-2 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">Total Inventory Value</h4>
                          <Tooltip
                            title="Total Inventory Value"
                            description="The total monetary value of all products currently in stock. This represents the sum of all inventory items multiplied by their unit costs."
                            formula="Σ (Quantity Available × Unit Cost) for all products"
                            example="If you have 100 units at LKR 50 each and 200 units at LKR 30 each, Total Value = (100 × 50) + (200 × 30) = LKR 11,000"
                            position="top"
                          />
                        </div>
                        <Package className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-purple-900 dark:text-purple-200">
                          LKR {dashboardData.stockValueAnalytics.totalInventoryValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-300 mt-0.5">
                          {dashboardData.stockValueAnalytics.totalProducts} {dashboardData.stockValueAnalytics.totalProducts === 1 ? 'product' : 'products'}
                        </p>
                      </div>
                    </div>

                    {/* Average Value Per Product */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/30 p-2 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Average Value Per Product</h4>
                          <Tooltip
                            title="Average Value Per Product"
                            description="The average monetary value per product in your inventory. This helps you understand the typical value of a single product in your stock."
                            formula="Total Inventory Value ÷ Number of Unique Products"
                            example="If Total Value is LKR 100,000 and you have 50 unique products, Average = 100,000 ÷ 50 = LKR 2,000 per product"
                            position="top"
                          />
                        </div>
                        <AlertCircle className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-indigo-900 dark:text-indigo-200">
                          LKR {dashboardData.stockValueAnalytics.averageStockValuePerProduct.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-0.5">
                          Per product average
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Charts Section - Compact */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
                    {/* Category Value Bar Chart */}
                    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-2 bg-gray-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-1">
                            <Package className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Value by Category</h4>
                          <Tooltip
                            title="Inventory Value by Category"
                            description="Bar chart showing the total inventory value grouped by product categories."
                            position="top"
                          />
                        </div>
                      </div>
                      {dashboardData.stockValueAnalytics.inventoryValueByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart
                            data={dashboardData.stockValueAnalytics.inventoryValueByCategory.slice(0, 8).map(cat => ({
                              name: cat.categoryName.length > 12 ? cat.categoryName.substring(0, 12) + '...' : cat.categoryName,
                              value: cat.value,
                              fullName: cat.categoryName,
                              percentage: cat.percentage
                            }))}
                            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10, fill: '#6b7280' }}
                              className="dark:fill-slate-400"
                              angle={-45}
                              textAnchor="end"
                              height={50}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: '#6b7280' }}
                              className="dark:fill-slate-400"
                              tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}K`}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                color: '#111827'
                              }}
                              formatter={(value: number | undefined, name: string | undefined, props: any) => {
                                if (value === undefined) return ['N/A', `Value (${props?.payload?.percentage?.toFixed(1) || '0'}%)`];
                                return [
                                  `LKR ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                  `Value (${props?.payload?.percentage?.toFixed(1) || '0'}%)`
                                ];
                              }}
                              labelFormatter={(label) => `Category: ${label}`}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {dashboardData.stockValueAnalytics.inventoryValueByCategory.slice(0, 8).map((entry, index) => {
                                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">No category data available</p>
                        </div>
                      )}
                    </div>

                    {/* Brand Value Bar Chart */}
                    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-2 bg-gray-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-1">
                            <Package className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                          </div>
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Value by Brand</h4>
                          <Tooltip
                            title="Inventory Value by Brand"
                            description="Bar chart showing the total inventory value grouped by product brands."
                            position="top"
                          />
                        </div>
                      </div>
                      {dashboardData.stockValueAnalytics.inventoryValueByBrand.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart
                            data={dashboardData.stockValueAnalytics.inventoryValueByBrand.slice(0, 8).map(brand => ({
                              name: brand.brandName.length > 12 ? brand.brandName.substring(0, 12) + '...' : brand.brandName,
                              value: brand.value,
                              fullName: brand.brandName,
                              percentage: brand.percentage
                            }))}
                            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10, fill: '#6b7280' }}
                              className="dark:fill-slate-400"
                              angle={-45}
                              textAnchor="end"
                              height={50}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: '#6b7280' }}
                              className="dark:fill-slate-400"
                              tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}K`}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                color: '#111827'
                              }}
                              formatter={(value: number | undefined, name: string | undefined, props: any) => {
                                if (value === undefined) return ['N/A', `Value (${props?.payload?.percentage?.toFixed(1) || '0'}%)`];
                                return [
                                  `LKR ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                  `Value (${props?.payload?.percentage?.toFixed(1) || '0'}%)`
                                ];
                              }}
                              labelFormatter={(label) => `Brand: ${label}`}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {dashboardData.stockValueAnalytics.inventoryValueByBrand.slice(0, 8).map((entry, index) => {
                                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">No brand data available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Value Trends Line Chart - Compact */}
                  <div className="border-t border-gray-200 dark:border-slate-700 pt-2 mb-2">
                    <div className="flex items-center mb-2">
                      <div className="w-4 h-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-1.5">
                        <Clock className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Value Trends</h4>
                        <Tooltip
                          title="Inventory Value Trends"
                          description="Line chart showing the inventory value over different time periods."
                          position="top"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-2 border border-gray-200 dark:border-slate-700">
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart
                          data={[
                            {
                              period: '30 Days',
                              value: dashboardData.stockValueAnalytics.inventoryValueTrend.last30Days
                            },
                            {
                              period: '90 Days',
                              value: dashboardData.stockValueAnalytics.inventoryValueTrend.last90Days
                            },
                            {
                              period: 'Current',
                              value: dashboardData.stockValueAnalytics.totalInventoryValue
                            }
                          ]}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            className="dark:fill-slate-400"
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            className="dark:fill-slate-400"
                            tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}K`}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              color: '#111827'
                            }}
                            formatter={(value: number | undefined, name?: string) => {
                              if (value === undefined) return ['N/A', 'Inventory Value'];
                              return [
                                `LKR ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                'Inventory Value'
                              ];
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 3 }}
                            activeDot={{ r: 5 }}
                            name="Inventory Value"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Trend Cards - Compact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Last 30 Days</p>
                          <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                        </div>
                        <p className="text-base font-bold text-blue-900 dark:text-blue-200">
                          LKR {dashboardData.stockValueAnalytics.inventoryValueTrend.last30Days.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 p-2 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-green-700 dark:text-green-300">Last 90 Days</p>
                          <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full"></div>
                        </div>
                        <p className="text-base font-bold text-green-900 dark:text-green-200">
                          LKR {dashboardData.stockValueAnalytics.inventoryValueTrend.last90Days.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            








            {/* {isStockKeeper(currentUser?.RoleID || 0) && (
              <div className="mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-green-900 dark:text-green-300 mb-2">Stock Management</h4>
                  <p className="text-green-700 dark:text-green-300">
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
              <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Low Stock Items Details</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Items with stock levels at or below their reorder points
                      </p>
                    </div>
                    <button
                      onClick={handleCloseLowStockModal}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Stock Levels Good!</h3>
                      <p className="text-gray-500 dark:text-gray-400">No items are currently below their reorder levels.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <AlertTriangle className="h-8 w-8 text-orange-400 dark:text-orange-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-orange-800 dark:text-orange-300">Low Stock Items</div>
                              <div className="text-2xl font-bold text-orange-900 dark:text-orange-200">{dashboardData.statistics.totalLowStockItems}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <Package className="h-8 w-8 text-red-400 dark:text-red-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-red-800 dark:text-red-300">Out of Stock</div>
                              <div className="text-2xl font-bold text-red-900 dark:text-red-200">{dashboardData.statistics.outOfStockItems}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <Eye className="h-8 w-8 text-blue-400 dark:text-blue-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Showing Top</div>
                              <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{Math.min(10, dashboardData.lowStockItems.length)}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Low Stock Items Table */}
                      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Stock ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Product Information
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Variation Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Stock Levels
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                              {dashboardData.lowStockItems.map((item, index) => (
                                <tr key={item.stockId} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-700/50'} ${item.quantityAvailable === 0 ? 'bg-red-50 dark:bg-red-900/20' : item.quantityAvailable <= item.reorderLevel ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {String(item.stockId).padStart(3, '0')}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm">
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {getProductDisplayName(item)}
                                      </div>
                                      <div className="text-gray-500 dark:text-gray-400 mt-1">
                                        Product ID: {item.productId}
                                      </div>
                                      {item.brandName && (
                                        <div className="text-gray-500 dark:text-gray-400">
                                          Brand: {item.brandName}
                                        </div>
                                      )}
                                      {item.categoryName && (
                                        <div className="text-gray-500 dark:text-gray-400">
                                          Category: {item.categoryName}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm">
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {getVariationDisplayName(item)}
                                      </div>
                                      <div className="text-gray-500 dark:text-gray-400 mt-1">
                                        Variation ID: {String(item.variationId || 'N/A').padStart(3, '0')}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm">
                                      <div className={`font-bold ${item.quantityAvailable === 0 ? 'text-red-600 dark:text-red-400' : item.quantityAvailable <= item.reorderLevel ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                                        Available: {item.quantityAvailable}
                                      </div>
                                      <div className="text-gray-500 dark:text-gray-400">
                                        Reorder Level: {item.reorderLevel}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      {item.location || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.quantityAvailable === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                      item.quantityAvailable <= item.reorderLevel ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                                        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
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
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-between">
                  <button
                    onClick={handleNavigateToStock}
                    disabled={isNavigatingToStock}
                    className="px-6 py-3 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {isNavigatingToStock ? 'Loading...' : 'Go to Stock Management'}
                  </button>
                  <button
                    onClick={handleCloseLowStockModal}
                    className="px-6 py-3 bg-gray-600 dark:bg-slate-600 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-slate-700 transition-colors"
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
              <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Return Details</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Return ID: {String(viewingReturn.returnId).padStart(3, '0')} •
                        Supplier: {viewingReturn.supplier?.supplierName} •
                        Date: {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={handleCloseViewModal}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Return Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return ID</label>
                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                            {String(viewingReturn.returnId).padStart(3, '0')}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Number</label>
                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                            {viewingReturn.returnNumber}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {viewingReturn.supplier?.supplierName}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Date</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Type</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {getReturnTypeName(viewingReturn.returnType)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewingReturn.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                            viewingReturn.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                              viewingReturn.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300'
                            }`}>
                            {viewingReturn.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stockkeeper</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {viewingReturn.employee?.userName || `ID: ${String(viewingReturn.returnedBy).padStart(4, '0')}`}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                          <p className="text-sm text-gray-900 dark:text-white">{viewingReturn.reason || 'N/A'}</p>
                        </div>
                        {viewingReturn.remarks && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                            <p className="text-sm text-gray-900 dark:text-white">{viewingReturn.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Return Product Details Table */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Return Product Details ({viewingReturn.details.length} {viewingReturn.details.length === 1 ? 'item' : 'items'})
                      </h3>

                      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Return Product ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Product Information
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Variation Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                              {viewingReturn.details.map((detail, index) => (
                                <tr key={detail.returnProductId || index} className={index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-700/50'}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {String(detail.returnProductId || 'N/A').padStart(4, '0')}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm">
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {getReturnProductDisplayName(detail.productName || 'Unknown Product', detail.productSku)}
                                      </div>
                                      <div className="text-gray-500 dark:text-gray-400 mt-1">
                                        Product ID: {detail.productId || 'N/A'}
                                      </div>
                                      {detail.brandName && (
                                        <div className="text-gray-500 dark:text-gray-400">
                                          Brand: {detail.brandName}
                                        </div>
                                      )}
                                      {detail.categoryName && (
                                        <div className="text-gray-500 dark:text-gray-400">
                                          Category: {detail.categoryName}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm">
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {getReturnVariationDisplayName(detail)}
                                      </div>
                                      <div className="text-gray-500 dark:text-gray-400 mt-1">
                                        Variation ID: {String(detail.variationId || 'N/A').padStart(3, '0')}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {(detail.quantityReturned || 0).toLocaleString()}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      {detail.remarks || 'No remarks'}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-100 dark:bg-slate-700">
                              <tr>
                                <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                                  Total Items Returned:
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">
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
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-between">
                  <div>
                    {viewingReturn.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          handleApproveReturn(viewingReturn.returnId);
                          handleCloseViewModal();
                        }}
                        disabled={isApprovingReturn === viewingReturn.returnId}
                        className="px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
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

