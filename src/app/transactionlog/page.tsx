'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table, { TableColumn, ActionButton } from '@/components/Table/table';
import SidebarWrapper from '@/components/Common/SidebarWraper';
import Navbar from '@/components/Common/navbar';
import Login from '@/components/login/login';
import { Employee, hasAdminAccess, isStockKeeper } from '@/types/user';
import { TransactionLogWithDetails, TransactionLogQueryParams, TransactionLogFilters } from '@/types/transactionlog';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { exportTransactionLogsToCSV } from '@/lib/services/transactionlogService';
import { Download } from 'lucide-react';
import Tooltip from '@/components/Common/Tooltip';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

// Service function to fetch transaction logs
const fetchTransactionLogs = async (params: TransactionLogQueryParams = {}) => {
  try {
    console.log(' Fetching transaction logs with params:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.search) queryParams.set('search', params.search);
    if (params.stockKeeperId) queryParams.set('stockKeeperId', params.stockKeeperId.toString());
    if (params.actionType) queryParams.set('actionType', params.actionType);
    if (params.entityName) queryParams.set('entityName', params.entityName);
    if (params.referenceId) queryParams.set('referenceId', params.referenceId.toString());
    if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.set('dateTo', params.dateTo);

    const url = queryParams.toString() ? `/api/transactionlog?${queryParams}` : '/api/transactionlog';
    console.log(' Request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch transaction logs error response:', errorData);
      throw new Error(errorData.message || 'Failed to fetch transaction logs');
    }
    
    const result = await response.json();
    console.log(' Transaction Logs API Response:', result);
    
    if (result.status === 'success' && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching transaction logs:', error);
    throw error;
  }
};

const TransactionLogPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [transactionLogs, setTransactionLogs] = useState<TransactionLogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<TransactionLogFilters>({
    stockKeeperId: null,
    actionType: null,
    entityName: null,
    referenceId: null,
    dateFrom: null,
    dateTo: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'logId' | 'employeeId' | 'actionType' | 'entityName' | 'referenceId' | 'actionDate'>('actionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter form states
  const [isFilterFormOpen, setIsFilterFormOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  const [isExportFormOpen, setIsExportFormOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<{
    exportAll: boolean;
    includeHeaders: boolean;
    dateRange: {
      start: string;
      end: string;
    } | null;
  }>({
    exportAll: true,
    includeHeaders: true,
    dateRange: null
  });
  const [isExporting, setIsExporting] = useState(false);
  usePageTitle('Transaction Log');

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Only allow stockkeepers to access transaction logs
          if (!isStockKeeper(user.RoleID)) {
            router.push('/home');
            return;
          }
          setCurrentUser(user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch transaction log data
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params: TransactionLogQueryParams = {
          page: currentPage,
          limit: 10,
          sortBy,
          sortOrder,
          search: searchTerm || undefined,
          stockKeeperId: filters.stockKeeperId || undefined,
          actionType: filters.actionType || undefined,
          entityName: filters.entityName || undefined,
          referenceId: filters.referenceId || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined
        };

        const data = await fetchTransactionLogs(params);
        
        setTransactionLogs(data.items);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        
        console.log('Loaded transaction logs:', data.items.length);
        
      } catch (err) {
        console.error('Error loading transaction logs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transaction logs');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn, currentPage, sortBy, sortOrder, searchTerm, filters]);

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access transaction logs.');
      return;
    }
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setCurrentUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Sidebar handlers
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSidebarExpandChange = (isExpanded: boolean) => {
    setIsSidebarExpanded(isExpanded);
  };

  // Filter handlers
  const handleFilterChange = (key: keyof TransactionLogFilters, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value || null
    }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setIsFilterFormOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      stockKeeperId: null,
      actionType: null,
      entityName: null,
      referenceId: null,
      dateFrom: null,
      dateTo: null
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setSearchTerm('');
    setCurrentPage(1);
    setIsFilterFormOpen(false);
  };

  // Export handlers
  const handleExportClick = () => {
    setIsExportFormOpen(true);
    setExportOptions({
      exportAll: true,
      includeHeaders: true,
      dateRange: null
    });
  };

  const handleCloseExportForm = () => {
    if (isExporting) return;
    setIsExportFormOpen(false);
  };

  const handleExportSubmit = async () => {
    try {
      setIsExporting(true);

      let logsToExport: TransactionLogWithDetails[] = [];

      if (exportOptions.exportAll) {
        // Fetch all transaction logs (not just the current page)
        const allLogsData = await fetchTransactionLogs({
          page: 1,
          limit: 10000, // Large limit to get all logs
          sortBy,
          sortOrder,
          // Apply current filters when exporting all
          search: searchTerm || undefined,
          stockKeeperId: filters.stockKeeperId || undefined,
          actionType: filters.actionType || undefined,
          entityName: filters.entityName || undefined,
          referenceId: filters.referenceId || undefined,
          dateFrom: exportOptions.dateRange?.start || filters.dateFrom || undefined,
          dateTo: exportOptions.dateRange?.end || filters.dateTo || undefined
        });
        logsToExport = allLogsData.items;
      } else {
        // Export only currently displayed logs
        logsToExport = transactionLogs;
      }

      // Apply date filter if specified in export options (overrides current filters)
      if (exportOptions.dateRange && exportOptions.dateRange.start && exportOptions.dateRange.end) {
        const startDate = new Date(exportOptions.dateRange.start);
        const endDate = new Date(exportOptions.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include entire end date

        logsToExport = logsToExport.filter(log => {
          if (!log.actionDate) return false;
          const logDate = new Date(log.actionDate);
          return logDate >= startDate && logDate <= endDate;
        });
      }

      if (logsToExport.length === 0) {
        alert('No transaction log records found to export');
        return;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `transaction_logs_export_${timestamp}.csv`;

      // Export to CSV
      await exportTransactionLogsToCSV(logsToExport, filename);

      alert(` Successfully exported ${logsToExport.length} transaction log records!`);
      
      setTimeout(() => {
        handleCloseExportForm();
      }, 1000);
    } catch (error) {
      console.error(' Export error:', error);
      alert(`Failed to export transaction logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Search handler
  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  // Format action type for display
  const formatActionType = (actionType: string) => {
    return actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format entity name for display
  const formatEntityName = (entityName: string) => {
    return entityName.toUpperCase();
  };

  // Format values for display
  const formatValue = (value: string | null, maxLength: number = 100) => {
    if (!value) return 'N/A';
    try {
      // Try to parse as JSON for better formatting
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      return formatted.length > maxLength ? `${formatted.substring(0, maxLength)}...` : formatted;
    } catch {
      // If not JSON, treat as regular string
      return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
    }
  };

  // Define table columns
  const columns: TableColumn[] = [
    {
      key: 'logId',
      label: 'Log ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {String(value).padStart(4, '0')}
        </span>
      )
    },
    {
      key: 'actionDate',
      label: 'Date & Time',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {new Date(value).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {new Date(value).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      )
    },
    {
      key: 'stockKeeperName',
      label: 'Stock Keeper',
      sortable: false,
      filterable: true,
      render: (value: string | null, row: TransactionLogWithDetails) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {value || 'Unknown User'}
          </div>
        </div>
      )
    },
    {
      key: 'actionType',
      label: 'Action',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
          {formatActionType(value)}
        </span>
      )
    },
    {
      key: 'entityName',
      label: 'Stock/Return',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {formatEntityName(value)}
        </span>
      )
    },
    {
      key: 'referenceId',
      label: 'Reference ID',
      sortable: true,
      filterable: true,
      render: (value: number | null) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value ? `${value}` : 'N/A'}
        </span>
      )
    },
    {
      key: 'oldValue',
      label: 'Old Value',
      sortable: false,
      render: (value: string | null) => {
        if (!value) return '-';

        try {
          const parsed = JSON.parse(value);
          return (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {parsed.previousQuantity ?? '-'}
            </div>
          );
        } catch (error) {
          // Fallback if value is not valid JSON
          return (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {value}
            </div>
          );
        }
      }
    },
    {
      key: 'newValue',
      label: 'New Value',
      sortable: false,
      render: (value: string | null) => {
        if (!value) return '-';

        try {
          const parsed = JSON.parse(value);
          return (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {parsed.newQuantity ?? '-'}
            </div>
          );
        } catch (error) {
          // Fallback if value is not valid JSON
          return (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {value}
            </div>
          );
        }
      }
    }
  ];

  // Define action buttons
  const getActions = (): ActionButton[] => {
    if (!isStockKeeper(currentUser?.RoleID || 0)) {
      return [];
    }
    return [];
  };

  const actions = getActions();

  // Export Form Component
  const ExportForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-white">Export Transaction Logs to CSV</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Export transaction log records to a CSV file for external use
          </p>
        </div>

        {/* Export Options */}
        <div className="space-y-6 mb-6">
          {/* Export Scope */}
          <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Export Scope</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportScope"
                  checked={exportOptions.exportAll}
                  onChange={() => setExportOptions(prev => ({ ...prev, exportAll: true }))}
                  disabled={isExporting}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Export all transaction logs (with current filters applied)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportScope"
                  checked={!exportOptions.exportAll}
                  onChange={() => setExportOptions(prev => ({ ...prev, exportAll: false }))}
                  disabled={isExporting}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Export currently displayed logs only ({transactionLogs.length} records)</span>
              </label>
            </div>
          </div>

          {/* Date Range Filter (Optional) */}
          <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Additional Date Range Filter (Optional)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">This will further filter the exported data</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={exportOptions.dateRange?.start || ''}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: {
                      start: e.target.value,
                      end: prev.dateRange?.end || ''
                    }
                  }))}
                  disabled={isExporting}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={exportOptions.dateRange?.end || ''}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: {
                      start: prev.dateRange?.start || '',
                      end: e.target.value
                    }
                  }))}
                  disabled={isExporting}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={() => setExportOptions(prev => ({ ...prev, dateRange: null }))}
              disabled={isExporting}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Clear date filter
            </button>
          </div>

          {/* CSV Options */}
          <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">CSV Options</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeHeaders}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                disabled={isExporting}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Include column headers</span>
            </label>
          </div>

          {/* Export Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Export Preview</h3>
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <div>Records to export: <strong>{exportOptions.exportAll ? 'All logs (with filters)' : transactionLogs.length}</strong></div>
              {exportOptions.dateRange?.start && exportOptions.dateRange?.end && (
                <div>
                  Date range: <strong>{exportOptions.dateRange.start}</strong> to <strong>{exportOptions.dateRange.end}</strong>
                </div>
              )}
              <div>File format: <strong>CSV (Comma-separated values)</strong></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleExportSubmit}
            disabled={isExporting}
            className="px-6 py-3 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export to CSV'}
          </button>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-3 bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const params: TransactionLogQueryParams = {
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
        search: searchTerm || undefined,
        stockKeeperId: filters.stockKeeperId || undefined,
        actionType: filters.actionType || undefined,
        entityName: filters.entityName || undefined,
        referenceId: filters.referenceId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
      };
      
      const data = await fetchTransactionLogs(params);
      setTransactionLogs(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner during auth check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-indigo-500 mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Show access denied for unauthorized users
  if (!isStockKeeper(currentUser?.RoleID || 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 dark:text-red-400 text-4xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Only stockkeepers can access transaction logs.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="px-6 py-3 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
        <Navbar currentUser={currentUser} onMenuClick={toggleSidebar} />
        <SidebarWrapper
          currentUser={currentUser}
          onLogout={handleLogout} 
          isMobileOpen={isSidebarOpen}
          onMobileClose={closeMobileSidebar}
          onExpandedChange={handleSidebarExpandChange}
        />
        <div className={`pt-[70px] transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'}`}>
          <main className="overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="text-center">
                  <div className="text-red-500 dark:text-red-400 text-xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Data</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                  <div className="space-x-4">
                    <button onClick={refreshData} className="px-4 py-2 bg-blue-600 dark:bg-indigo-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-indigo-700 transition-colors">
                      Retry
                    </button>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-slate-500 transition-colors">
                      Reload Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
      {/* Navbar */}
      <Navbar currentUser={currentUser} onMenuClick={toggleSidebar} />

      {/* Role-based Sidebar */}
      <SidebarWrapper
        currentUser={currentUser}
        onLogout={handleLogout} 
        isMobileOpen={isSidebarOpen}
        onMobileClose={closeMobileSidebar}
        onExpandedChange={handleSidebarExpandChange}
      />

      {/* Main Content */}
      <div className={`pt-[70px] transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'}`}>
        <main className="overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
          <div className="max-w-full">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaction Logs</h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    View all system transaction logs and audit trail
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Tooltip content="Export Transaction Logs to CSV file" position="bottom">
                    <button
                      onClick={handleExportClick}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    >
                      <Download size={20} className="mr-2" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Refresh data" position="bottom">
                    <button
                      onClick={refreshData}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Active Filters Display */}
              {(Object.values(filters).some(v => v !== null) || searchTerm) && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Active Filters:</h3>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {searchTerm && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Search: "{searchTerm}"
                          </span>
                        )}
                        {filters.stockKeeperId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Stock Keeper ID: {filters.stockKeeperId}
                          </span>
                        )}
                        {filters.actionType && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Action: {formatActionType(filters.actionType)}
                          </span>
                        )}
                        {filters.entityName && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Entity: {formatEntityName(filters.entityName)}
                          </span>
                        )}
                        {filters.referenceId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Reference ID: {filters.referenceId}
                          </span>
                        )}
                        {filters.dateFrom && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            From: {filters.dateFrom}
                          </span>
                        )}
                        {filters.dateTo && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            To: {filters.dateTo}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
              <Table
                data={transactionLogs}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No transaction logs found."
                className="border border-gray-200 dark:border-slate-700"
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> of{' '}
                      <span className="font-medium">{totalItems}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-blue-50 dark:bg-indigo-900/30 border-blue-500 dark:border-indigo-500 text-blue-600 dark:text-indigo-300'
                                : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Export Form Popup */}
      {isExportFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseExportForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                <button
                  onClick={handleCloseExportForm}
                  disabled={isExporting}
                  className="absolute right-4 top-4 z-10 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <ExportForm onClose={handleCloseExportForm} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Modal */}
      {isFilterFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsFilterFormOpen(false)}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6">
                <button
                  onClick={() => setIsFilterFormOpen(false)}
                  className="absolute right-4 top-4 z-10 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Filters</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Filter transaction logs by specific criteria
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stock Keeper ID</label>
                    <input
                      type="number"
                      placeholder="Enter stock keeper ID"
                      value={tempFilters.stockKeeperId || ''}
                      onChange={(e) => handleFilterChange('stockKeeperId', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Type</label>
                    <select
                      value={tempFilters.actionType || ''}
                      onChange={(e) => handleFilterChange('actionType', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">All Actions</option>
                      <option value="CREATE">Create</option>
                      <option value="UPDATE">Update</option>
                      <option value="DELETE">Delete</option>
                      <option value="STOCK_IN">Stock In</option>
                      <option value="STOCK_OUT">Stock Out</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entity Name</label>
                    <select
                      value={tempFilters.entityName || ''}
                      onChange={(e) => handleFilterChange('entityName', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">All Entities</option>
                      <option value="GRN">GRN</option>
                      <option value="GIN">GIN</option>
                      <option value="PRODUCT">Product</option>
                      <option value="STOCK">Stock</option>
                      <option value="BINCARD">Bincard</option>
                      <option value="SUPPLIER">Supplier</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reference ID</label>
                    <input
                      type="number"
                      placeholder="Enter reference ID"
                      value={tempFilters.referenceId || ''}
                      onChange={(e) => handleFilterChange('referenceId', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date From</label>
                    <input
                      type="date"
                      value={tempFilters.dateFrom || ''}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date To</label>
                    <input
                      type="date"
                      value={tempFilters.dateTo || ''}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-600 border border-gray-300 dark:border-slate-700 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-indigo-600 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionLogPage;