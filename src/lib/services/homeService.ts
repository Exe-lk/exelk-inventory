

import { ReturnResponse } from '@/types/return';
import { Employee } from '@/types/user';

// Base URL for Home API
const BASE_URL = '/api/home';

// Interface for dashboard statistics
export interface DashboardStatistics {
  totalReturns: number;
  pendingReturns: number;
  approvedReturns: number;
  rejectedReturns: number;
  totalLowStockItems: number;
  outOfStockItems: number;
  stockValueAnalytics?: StockValueAnalytics;
  grnAnalytics?: GRNAnalytics;
  ginAnalytics?: GINAnalytics;
}

export interface LowStockItem {
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


export interface StockValueAnalytics {
  totalInventoryValue: number;
  inventoryValueByCategory: Array<{
    categoryId: number;
    categoryName: string;
    value: number;
    percentage: number;
  }>;
  inventoryValueByBrand: Array<{
    brandId: number;
    brandName: string;
    value: number;
    percentage: number;
  }>;
  averageStockValuePerProduct: number;
  totalProducts: number;
  inventoryValueTrend: {
    last30Days: number;
    last90Days: number;
  };
}
export interface GRNAnalytics {
  totalGRNsThisMonth: number;
  totalGRNsLastMonth: number;
  totalValueThisMonth: number;
  totalValueLastMonth: number;
  averageGRNValue: number;
  grnValueTrend: Array<{
    date: string; // Format: "YYYY-MM-DD"
    value: number; // Total value for that date
    count: number; // Number of GRNs on that date
  }>;
}

export interface GINAnalytics {
  totalGINsThisMonth: number;
  totalGINsLastMonth: number;
  totalQuantityIssuedThisMonth: number;
  totalQuantityIssuedLastMonth: number;
  averageGINValue: number;
  quantityIssuedTrend: Array<{
    date: string; // Format: "YYYY-MM-DD"
    quantity: number; // Total quantity issued on that date
    count: number; // Number of GINs on that date
  }>;
}

// Update DashboardStatistics interface (around line 10

// Update DashboardData interface (around line 38)
export interface DashboardData {
  user?: Omit<Employee, 'Password'>;
  role?: string;
  statistics: DashboardStatistics;
  pendingReturns: ReturnResponse[];
  lowStockItems: LowStockItem[];
  stockValueAnalytics?: StockValueAnalytics; 
  grnAnalytics?: GRNAnalytics;
  ginAnalytics?: GINAnalytics;
}




// Interface for approve return request
export interface ApproveReturnRequest {
  returnId: number;
}

// Interface for stock update details
export interface StockUpdateDetail {
  stockId: number;
  productId: number;
  variationId: number;
  productName: string;
  variationName: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityDeducted: number;
  action: string;
}

// Interface for bin card entry
export interface BinCardEntryDetail {
  binCardId: number;
  variationId: number;
  transactionType: string;
  quantityOut: number;
  balance: number;
  transactionDate: string;
}

// Interface for product detail
export interface ProductDetail {
  returnProductId: number;
  productId: number;
  productName: string;
  productSku?: string;
  variationId: number;
  variationName: string;
  quantityReturned: number;
  stockBefore: number;
  stockAfter: number;
}

// Enhanced interface for approve return response
export interface ApproveReturnResponse {
  returnId: number;
  approved: boolean;
  returnStatus: string;
  stockUpdates: StockUpdateDetail[];
  binCardEntries: BinCardEntryDetail[];
  productDetails: ProductDetail[];
  summary: {
    totalItemsProcessed: number;
    totalQuantityDeducted: number;
    stockEntriesUpdated: number;
    binCardEntriesCreated: number;
  };
  auditTrail: {
    approvedBy: number;
    approvedAt: string;
    transactionLogCreated: boolean;
    binCardEntriesCreated: number;
    stockUpdatesCompleted: number;
  };
}

// Fetch dashboard data including pending returns
// export async function fetchDashboardData(): Promise<DashboardData> {
//   try {
//     console.log(' Fetching dashboard data');
    
//     const response = await fetch(BASE_URL, {
//       method: 'GET',
//       credentials: 'include',
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error(' Fetch dashboard data error response:', errorData);
//       throw new Error(errorData.message || 'Failed to fetch dashboard data');
//     }
    
//     const result = await response.json();
//     console.log(' Dashboard data API Response:', result);
    
//     if (result.status === 'success' && result.data) {
//       return result.data;
//     } else {
//       throw new Error(result.message || 'Invalid response format');
//     }
//   } catch (error) {
//     console.error(' Error fetching dashboard data:', error);
//     throw error;
//   }
// }



// Add cache duration constant at the top (after imports, around line 134)
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for dashboard data

// ... existing code ...

// Update fetchDashboardData function (around line 238)
export async function fetchDashboardData(): Promise<DashboardData> {
  const cacheKey = 'dashboard_data_cache';
  
  // Check for cached data
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log(' Using cached dashboard data');
        return data;
      } else {
        // Cache expired, remove it
        sessionStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    // If cache read fails (e.g., storage disabled), continue to fetch
    console.warn(' Failed to read dashboard cache:', error);
  }
  
  try {
    console.log(' Fetching dashboard data');
    
    const response = await fetch(BASE_URL, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch dashboard data error response:', errorData);
      
      // If fetch fails, try to return stale cache as fallback
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log(' Using stale cache due to fetch error');
          return data;
        }
      } catch (fallbackError) {
        // Ignore fallback errors
      }
      
      throw new Error(errorData.message || 'Failed to fetch dashboard data');
    }
    
    const result = await response.json();
    console.log(' Dashboard data API Response:', result);
    
    if (result.status === 'success' && result.data) {
      // Cache the successful response
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: result.data,
          timestamp: Date.now()
        }));
        console.log(' Dashboard data cached successfully');
      } catch (cacheError) {
        // If caching fails (e.g., storage full), continue without caching
        console.warn(' Failed to cache dashboard data:', cacheError);
      }
      
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching dashboard data:', error);
    
    // If fetch fails, try to return stale cache as fallback
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log(' Using stale cache due to fetch error');
        return data;
      }
    } catch (fallbackError) {
      // Ignore fallback errors
    }
    
    throw error;
  }
}

// Add cache invalidation helper function (add after refreshDashboard function)
export function clearDashboardCache(): void {
  try {
    sessionStorage.removeItem('dashboard_data_cache');
    console.log(' Dashboard cache cleared');
  } catch (error) {
    console.warn(' Failed to clear dashboard cache:', error);
  }
}

// Update refreshDashboard to clear cache before fetching (around line 320)
export async function refreshDashboard(): Promise<DashboardData> {
  try {
    console.log(' Refreshing dashboard data');
    // Clear cache to force fresh fetch
    clearDashboardCache();
    return await fetchDashboardData();
  } catch (error) {
    console.error(' Error refreshing dashboard:', error);
    throw error;
  }
}



// Approve a pending return with stock updates
export async function approveReturn(returnId: number): Promise<ApproveReturnResponse> {
  try {
    console.log(` Approving return ${returnId} with stock updates`);
    
    const requestData: ApproveReturnRequest = {
      returnId
    };
    
    const response = await fetch(BASE_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Approve return error response:', errorData);
      throw new Error(errorData.message || 'Failed to approve return');
    }
    
    const result = await response.json();
    console.log(' Approve return API Response:', result);
    
    if (result.status === 'success' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error approving return:', error);
    throw error;
  }
}

// Fetch only pending returns (utility function)
export async function fetchPendingReturns(): Promise<ReturnResponse[]> {
  try {
    const dashboardData = await fetchDashboardData();
    return dashboardData.pendingReturns;
  } catch (error) {
    console.error(' Error fetching pending returns:', error);
    throw error;
  }
}

// Refresh dashboard data (utility function)
// export async function refreshDashboard(): Promise<DashboardData> {
//   try {
//     console.log(' Refreshing dashboard data');
//     return await fetchDashboardData();
//   } catch (error) {
//     console.error(' Error refreshing dashboard:', error);
//     throw error;
//   }
// }

// Get stock summary for a specific return (utility function)
export async function getReturnStockImpact(returnId: number): Promise<any> {
  try {
    console.log(` Calculating stock impact for return ${returnId}`);
    
    const response = await fetch(`${BASE_URL}/stock-impact?returnId=${returnId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get stock impact');
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error getting stock impact:', error);
    throw error;
  }
}

export async function getLowStockDetails(): Promise<LowStockItem[]> {
  try {
    console.log(' Fetching detailed low stock information');
    
    const dashboardData = await fetchDashboardData();
    return dashboardData.lowStockItems;
  } catch (error) {
    console.error(' Error fetching low stock details:', error);
    throw error;
  }
}

export async function getCriticalStockAlerts(): Promise<LowStockItem[]> {
  try {
    console.log(' Fetching critical stock alerts');
    
    const dashboardData = await fetchDashboardData();
    return dashboardData.lowStockItems.filter(item => item.quantityAvailable === 0);
  } catch (error) {
    console.error(' Error fetching critical stock alerts:', error);
    throw error;
  }
}