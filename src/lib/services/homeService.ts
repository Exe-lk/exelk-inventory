// import { ReturnResponse } from '@/types/return';

// // Base URL for Home API
// const BASE_URL = '/api/home';

// // Interface for dashboard statistics
// export interface DashboardStatistics {
//   totalReturns: number;
//   pendingReturns: number;
//   approvedReturns: number;
//   rejectedReturns: number;
// }

// // Interface for dashboard data
// export interface DashboardData {
//   statistics: DashboardStatistics;
//   pendingReturns: ReturnResponse[];
// }

// // Interface for approve return request
// export interface ApproveReturnRequest {
//   returnId: number;
// }

// // Interface for approve return response
// export interface ApproveReturnResponse {
//   returnId: number;
//   approved: boolean;
//   returnStatus: string;
// }

// // Fetch dashboard data including pending returns
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

// // Approve a pending return
// export async function approveReturn(returnId: number): Promise<ApproveReturnResponse> {
//   try {
//     console.log(` Approving return ${returnId}`);
    
//     const requestData: ApproveReturnRequest = {
//       returnId
//     };
    
//     const response = await fetch(BASE_URL, {
//       method: 'POST',
//       credentials: 'include',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(requestData)
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error(' Approve return error response:', errorData);
//       throw new Error(errorData.message || 'Failed to approve return');
//     }
    
//     const result = await response.json();
//     console.log(' Approve return API Response:', result);
    
//     if (result.status === 'success' && result.data) {
//       return result.data;
//     } else {
//       throw new Error(result.message || 'Invalid response format');
//     }
//   } catch (error) {
//     console.error(' Error approving return:', error);
//     throw error;
//   }
// }

// // Fetch only pending returns (utility function)
// export async function fetchPendingReturns(): Promise<ReturnResponse[]> {
//   try {
//     const dashboardData = await fetchDashboardData();
//     return dashboardData.pendingReturns;
//   } catch (error) {
//     console.error(' Error fetching pending returns:', error);
//     throw error;
//   }
// }

// // Refresh dashboard data (utility function)
// export async function refreshDashboard(): Promise<DashboardData> {
//   try {
//     console.log(' Refreshing dashboard data');
//     return await fetchDashboardData();
//   } catch (error) {
//     console.error(' Error refreshing dashboard:', error);
//     throw error;
//   }
// }






import { ReturnResponse } from '@/types/return';

// Base URL for Home API
const BASE_URL = '/api/home';

// Interface for dashboard statistics
export interface DashboardStatistics {
  totalReturns: number;
  pendingReturns: number;
  approvedReturns: number;
  rejectedReturns: number;
}

// Interface for dashboard data
export interface DashboardData {
  statistics: DashboardStatistics;
  pendingReturns: ReturnResponse[];
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
export async function fetchDashboardData(): Promise<DashboardData> {
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
      throw new Error(errorData.message || 'Failed to fetch dashboard data');
    }
    
    const result = await response.json();
    console.log(' Dashboard data API Response:', result);
    
    if (result.status === 'success' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching dashboard data:', error);
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
export async function refreshDashboard(): Promise<DashboardData> {
  try {
    console.log(' Refreshing dashboard data');
    return await fetchDashboardData();
  } catch (error) {
    console.error(' Error refreshing dashboard:', error);
    throw error;
  }
}

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