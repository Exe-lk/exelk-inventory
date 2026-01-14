'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table, { TableColumn, ActionButton } from '@/components/Table/table';
import SidebarWrapper from '@/components/Common/SidebarWraper';
import Navbar from '@/components/Common/navbar';
import Login from '@/components/login/login';
import Form, { FormField } from '@/components/form-popup/create';
import UpdateForm from '@/components/form-popup/update';
import DeleteConfirmation from '@/components/form-popup/delete';
import { Employee, isStockKeeper } from '@/types/user';
import { BinCardWithDetails, BinCardQueryParams, CreateBinCardRequest, BinCardFilters } from '@/types/bincard';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { Pencil, Eye, Trash2, Download } from 'lucide-react';
import { 
  fetchBinCards, 
  fetchBinCardById, 
  createBinCard,
  clearBinCardCache,
  exportBinCardsToCSV 
} from '@/lib/services/bincardService';
import Tooltip from '@/components/Common/Tooltip';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

const BinCardPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [binCards, setBinCards] = useState<BinCardWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<BinCardFilters>({
    variationId: null,
    transactionType: null,
    stockKeeperId: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'bincardId' | 'variationId' | 'transactionDate' | 'transactionType' | 'referenceId' | 'quantityIn' | 'quantityOut' | 'balance' | 'employeeId'>('transactionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [selectedBinCard, setSelectedBinCard] = useState<BinCardWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter form states
  const [isFilterFormOpen, setIsFilterFormOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  // View Bin Card Details states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewBinCardDetails, setViewBinCardDetails] = useState<any>(null);
  const [viewingBinCard, setViewingBinCard] = useState<BinCardWithDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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
  usePageTitle('Bin Card');

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Only allow stockkeepers to access bin cards
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

  // Fetch bin card data with caching
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to load cached data first for instant display
        try {
          const defaultParams: BinCardQueryParams = {
            page: currentPage,
            limit: 10,
            sortBy,
            sortOrder,
            search: searchTerm || undefined,
            variationId: filters.variationId || undefined,
            transactionType: filters.transactionType as 'GRN' | 'GIN' || undefined,
            stockKeeperId: filters.stockKeeperId || undefined
          };
          const cacheKey = `bincards_cache_${JSON.stringify(defaultParams)}`;
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (data) {
              setBinCards(data.items);
              setTotalPages(data.pagination.totalPages);
              setTotalItems(data.pagination.totalItems);
            }
          }
        } catch (cacheError) {
          console.warn('Cache read error:', cacheError);
        }
        
        const params: BinCardQueryParams = {
          page: currentPage,
          limit: 10,
          sortBy,
          sortOrder,
          search: searchTerm || undefined,
          variationId: filters.variationId || undefined,
          transactionType: filters.transactionType as 'GRN' | 'GIN' || undefined,
          stockKeeperId: filters.stockKeeperId || undefined
        };

        const data = await fetchBinCards(params);
        
        setBinCards(data.items);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        
        console.log('Loaded bin cards:', data.items.length);
        
      } catch (err) {
        console.error('Error loading bin cards:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bin cards');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn, currentPage, sortBy, sortOrder, searchTerm, filters]);

  // Handle View Bin Card Details
  const handleViewBinCardDetails = async (binCard: BinCardWithDetails) => {
    try {
      console.log('Viewing bin card details for:', binCard);
      setViewingBinCard(binCard);
      setIsLoadingDetails(true);
      setIsViewModalOpen(true);
      
      // Fetch complete bin card details (will use cache if available)
      const details = await fetchBinCardById(binCard.binCardId);
      console.log('Fetched bin card details:', details);
      setViewBinCardDetails(details);
      
    } catch (error) {
      console.error('Error fetching bin card details:', error);
      alert('Failed to load bin card details. Please try again.');
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingBinCard(null);
    setViewBinCardDetails(null);
    setIsLoadingDetails(false);
  };

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access bin card management.');
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
  const handleFilterChange = (key: keyof BinCardFilters, value: any) => {
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
      variationId: null,
      transactionType: null,
      stockKeeperId: null
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

      let binCardsToExport: BinCardWithDetails[] = [];

      if (exportOptions.exportAll) {
        // Fetch all bin cards (not just the current page)
        const allBinCardsData = await fetchBinCards({
          page: 1,
          limit: 10000, // Large limit to get all bin cards
          sortBy,
          sortOrder,
          // Apply current filters when exporting all
          search: searchTerm || undefined,
          variationId: filters.variationId || undefined,
          transactionType: filters.transactionType as 'GRN' | 'GIN' || undefined,
          stockKeeperId: filters.stockKeeperId || undefined
        });
        binCardsToExport = allBinCardsData.items;
      } else {
        // Export only currently displayed bin cards
        binCardsToExport = binCards;
      }

      // Apply date filter if specified in export options
      if (exportOptions.dateRange && exportOptions.dateRange.start && exportOptions.dateRange.end) {
        const startDate = new Date(exportOptions.dateRange.start);
        const endDate = new Date(exportOptions.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include entire end date

        binCardsToExport = binCardsToExport.filter(binCard => {
          if (!binCard.transactionDate) return false;
          const binCardDate = new Date(binCard.transactionDate);
          return binCardDate >= startDate && binCardDate <= endDate;
        });
      }

      if (binCardsToExport.length === 0) {
        alert('No bin card records found to export');
        return;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `bincard_export_${timestamp}.csv`;

      // Export to CSV
      await exportBinCardsToCSV(binCardsToExport, filename);

      alert(`Successfully exported ${binCardsToExport.length} bin card records!`);
      
      setTimeout(() => {
        handleCloseExportForm();
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export bin cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Search handler
  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  // Handle create bin card form submission with cache invalidation
  const handleCreateBinCard = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      console.log('Creating bin card with data:', formData);
      
      const binCardData: CreateBinCardRequest = {
        variationId: parseInt(formData.variationId),
        transactionDate: formData.transactionDate,
        transactionType: formData.transactionType as 'GRN' | 'GIN',
        referenceId: formData.referenceId ? parseInt(formData.referenceId) : undefined,
        quantityIn: formData.quantityIn ? parseInt(formData.quantityIn) : undefined,
        quantityOut: formData.quantityOut ? parseInt(formData.quantityOut) : undefined,
        balance: parseInt(formData.balance),
        stockKeeperId: parseInt(formData.stockKeeperId),
        remarks: formData.remarks || undefined
      };
      
      await createBinCard(binCardData);
      
      // Clear cache before refreshing to ensure fresh data
      clearBinCardCache();
      
      // Refresh data
      await refreshData();
      
      setIsCreateFormOpen(false);
      alert('Bin card entry created successfully!');
      
    } catch (err) {
      console.error('Error creating bin card:', err);
      alert('Failed to create bin card entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format transaction type for display
  const formatTransactionType = (type: string) => {
    return type === 'GRN' ? 'Goods Received Note' : 'Goods Issue Note';
  };

  // Define form fields for bin card creation
  const getFormFields = (): FormField[] => [
    {
      name: 'variationId',
      label: 'Variation ID',
      type: 'number',
      placeholder: 'Enter variation ID',
      required: true,
      validation: (value: string) => {
        if (!value || parseInt(value) <= 0) {
          return 'Valid variation ID is required';
        }
        return null;
      }
    },
    {
      name: 'transactionDate',
      label: 'Transaction Date',
      type: 'date',
      placeholder: 'Select transaction date',
      required: true
    },
    {
      name: 'transactionType',
      label: 'Transaction Type',
      type: 'select',
      placeholder: 'Select transaction type',
      required: true,
      options: [
        { label: 'Goods Received Note (GRN)', value: 'GRN' },
        { label: 'Goods Issue Note (GIN)', value: 'GIN' }
      ]
    },
    {
      name: 'referenceId',
      label: 'Reference ID',
      type: 'number',
      placeholder: 'Enter reference ID (optional)',
      required: false
    },
    {
      name: 'quantityIn',
      label: 'Quantity In',
      type: 'number',
      placeholder: 'Enter quantity in',
      required: false,
      validation: (value: string) => {
        if (value && parseInt(value) < 0) {
          return 'Quantity in must be non-negative';
        }
        return null;
      }
    },
    {
      name: 'quantityOut',
      label: 'Quantity Out',
      type: 'number',
      placeholder: 'Enter quantity out',
      required: false,
      validation: (value: string) => {
        if (value && parseInt(value) < 0) {
          return 'Quantity out must be non-negative';
        }
        return null;
      }
    },
    {
      name: 'balance',
      label: 'Balance',
      type: 'number',
      placeholder: 'Enter current balance',
      required: true,
      validation: (value: string) => {
        if (!value || parseInt(value) < 0) {
          return 'Balance is required and must be non-negative';
        }
        return null;
      }
    },
    {
      name: 'stockKeeperId',
      label: 'Stock Keeper ID',
      type: 'number',
      placeholder: 'Enter stock keeper ID',
      required: true,
      validation: (value: string) => {
        if (!value || parseInt(value) <= 0) {
          return 'Valid stock keeper ID is required';
        }
        return null;
      }
    },
    {
      name: 'remarks',
      label: 'Remarks',
      type: 'textarea',
      placeholder: 'Enter remarks (optional)',
      required: false,
      rows: 3
    }
  ];

  // Define table columns
  const columns: TableColumn[] = [
    {
      key: 'binCardId',
      label: 'Bin Card ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {String(value).padStart(4, '0')}
        </span>
      )
    },
    {
      key: 'transactionDate',
      label: 'Transaction Date',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="text-gray-900 dark:text-white">
          {value ? new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A'}
        </span>
      )
    },
    {
      key: 'transactionType',
      label: 'Transaction Type',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'GRN' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'variationId',
      label: 'Variation ID',
      sortable: true,
      filterable: true,
      render: (value: number, row: BinCardWithDetails) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
        </div>
      )
    },
    {
      key: 'productName',
      label: 'Product',
      sortable: false,
      filterable: true,
      render: (value: string | null, row: BinCardWithDetails) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {value || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'quantityIn',
      label: 'Qty In',
      sortable: true,
      render: (value: number) => (
        <span className={`font-medium ${value > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {value || '-'}
        </span>
      )
    },
    {
      key: 'quantityOut',
      label: 'Qty Out',
      sortable: true,
      render: (value: number) => (
        <span className={`font-medium ${value > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {value || '-'}
        </span>
      )
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {value}
        </span>
      )
    },
    {
      key: 'referenceId',
      label: 'GRN/GIN Ref ID',
      sortable: true,
      filterable: true,
      render: (value: number | null) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value ? `${value}` : 'N/A'}
        </span>
      )
    },
    {
      key: 'stockKeeperName',
      label: 'Stock Keeper',
      sortable: false,
      render: (value: string | null, row: BinCardWithDetails) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {value || 'Unknown'}
          </div>
          <div className="text-gray-500 dark:text-gray-400">ID: {row.stockKeeperId}</div>
        </div>
      )
    }
  ];

  // Define action buttons - Updated to include View Details
  const getActions = (): ActionButton[] => {
    if (!isStockKeeper(currentUser?.RoleID || 0)) {
      return [];
    }
    
    return [
      {
        label: (
          <span className="flex items-center gap-2">
            <Eye size={16} />
          </span>
        ),
        onClick: (binCard: BinCardWithDetails) => {
          handleViewBinCardDetails(binCard);
        },
        variant: 'secondary'
      }
    ];
  };

  const actions = getActions();

  // Export Form Component
  const ExportForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-white">Export Bin Cards to CSV</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Export bin card records to a CSV file for external use
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
                <span className="text-sm text-gray-700 dark:text-gray-300">Export all bin cards (with current filters applied)</span>
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
                <span className="text-sm text-gray-700 dark:text-gray-300">Export currently displayed bin cards only ({binCards.length} records)</span>
              </label>
            </div>
          </div>

          {/* Date Range Filter (Optional) */}
          <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Additional Date Range Filter (Optional)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">This will further filter the exported data by transaction date</p>
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
              <div>Records to export: <strong>{exportOptions.exportAll ? 'All bin cards (with filters)' : binCards.length}</strong></div>
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

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create bin card clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  // Refresh data with cache clearing
  const refreshData = async () => {
    try {
      setLoading(true);
      
      // Clear cache to force fresh fetch
      clearBinCardCache();
      
      const params: BinCardQueryParams = {
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
        search: searchTerm || undefined,
        variationId: filters.variationId || undefined,
        transactionType: filters.transactionType as 'GRN' | 'GIN' || undefined,
        stockKeeperId: filters.stockKeeperId || undefined
      };
      
      const data = await fetchBinCards(params);
      setBinCards(data.items);
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
            Only stockkeepers can access bin card management.
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
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bin Card Management</h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Track stock movements and maintain balance records for product variations
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-4">
                    <Tooltip content="Export Bin Card data to CSV file" position="bottom">
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
              </div>

              {/* Summary Info */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{binCards.filter(bc => bc.transactionType === 'GRN').length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">GRN Transactions</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{binCards.filter(bc => bc.transactionType === 'GIN').length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">GIN Transactions</div>
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
                        {filters.variationId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Variation ID: {filters.variationId}
                          </span>
                        )}
                        {filters.transactionType && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Type: {filters.transactionType}
                          </span>
                        )}
                        {filters.stockKeeperId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Stock Keeper ID: {filters.stockKeeperId}
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
                data={binCards}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No bin card records found. Create your first bin card entry to get started."
                onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                createButtonLabel="Create Bin Card Entry"
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

      {/* View Bin Card Details Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseViewModal}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bin Card Details</h2>
                      {viewingBinCard && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          ID: {String(viewingBinCard.binCardId).padStart(4, '0')} • 
                          Type: {viewingBinCard.transactionType} • 
                          Date: {new Date(viewingBinCard.transactionDate).toLocaleDateString()}
                        </p>
                      )}
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
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-indigo-500 mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading bin card details...</p>
                      </div>
                    </div>
                  ) : !viewBinCardDetails ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 dark:text-gray-500 text-xl mb-4">📄</div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Details Found</h3>
                      <p className="text-gray-500 dark:text-gray-400">Unable to load bin card details.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Transaction Details Section */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Transaction Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bin Card ID</label>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{String(viewBinCardDetails.binCardId).padStart(4, '0')}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Date</label>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {new Date(viewBinCardDetails.transactionDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Type</label>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              viewBinCardDetails.transactionType === 'GRN' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            }`}>
                              {formatTransactionType(viewBinCardDetails.transactionType)}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference ID</label>
                            <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.referenceId || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity In</label>
                            <p className={`text-sm font-medium ${viewBinCardDetails.quantityIn > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                              {viewBinCardDetails.quantityIn || '-'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity Out</label>
                            <p className={`text-sm font-medium ${viewBinCardDetails.quantityOut > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
                              {viewBinCardDetails.quantityOut || '-'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Balance</label>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{viewBinCardDetails.balance}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
                            <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.remarks || 'No remarks'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Product Information */}
                      {viewBinCardDetails.product && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Product Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product ID</label>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{viewBinCardDetails.product.id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{viewBinCardDetails.product.name || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU</label>
                              <p className="text-sm text-gray-900 dark:text-white font-mono">{viewBinCardDetails.product.sku || 'N/A'}</p>
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.product.description || 'No description available'}</p>
                            </div>
                          </div>

                          {/* Brand Information */}
                          {viewBinCardDetails.product.brand && (
                            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Brand Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand Name</label>
                                  <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.product.brand.name || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                                  <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.product.brand.country || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Category Information */}
                          {viewBinCardDetails.product.category && (
                            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Category Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                  <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.product.category.name || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Main Category</label>
                                  <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.product.category.mainCategory || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Supplier Information */}
                          {viewBinCardDetails.product.supplier && (
                            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Supplier Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Name</label>
                                  <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.product.supplier.name || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</label>
                                  <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.product.supplier.contactPerson || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                  <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.product.supplier.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                  <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.product.supplier.phone || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Version Information */}
                      {viewBinCardDetails.version && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Version Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Version ID</label>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{viewBinCardDetails.version.id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Version Number</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.version.number || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Release Date</label>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {viewBinCardDetails.version.releaseDate ? 
                                  new Date(viewBinCardDetails.version.releaseDate).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Product Variation Information */}
                      {viewBinCardDetails.variation && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Product Variation Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Variation ID</label>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{viewBinCardDetails.variation.id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Variation Name</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.variation.name || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.variation.color || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.variation.size || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.variation.capacity || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Barcode</label>
                              <p className="text-sm text-gray-900 dark:text-white font-mono">{viewBinCardDetails.variation.barcode || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {viewBinCardDetails.variation.price ? `LKR ${viewBinCardDetails.variation.price.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Quantity</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.variation.quantity || 0}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Levels</label>
                              <p className="text-sm text-gray-900 dark:text-white">
                                Min: {viewBinCardDetails.variation.minStockLevel || 'N/A'} | 
                                Max: {viewBinCardDetails.variation.maxStockLevel || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stock Keeper Information */}
                      {viewBinCardDetails.stockKeeper && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Stock Keeper Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Keeper ID</label>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{viewBinCardDetails.stockKeeper.id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.stockKeeper.name || 'Unknown'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.stockKeeper.email || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                              <p className="text-sm text-gray-900 dark:text-white">{viewBinCardDetails.stockKeeper.phone || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">
                  <button
                    onClick={handleCloseViewModal}
                    className="px-6 py-2 bg-gray-600 dark:bg-slate-600 text-white rounded-md hover:bg-gray-700 dark:hover:bg-slate-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Create Bin Card Form Popup */}
      {isCreateFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseCreateForm}></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                {/* Close button */}
                <button
                  onClick={handleCloseCreateForm}
                  className="absolute right-4 top-4 z-10 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Form */}
                <Form
                  fields={getFormFields()}
                  onSubmit={handleCreateBinCard}
                  onClear={() => {}}
                  title="Create New Bin Card Entry"
                  submitButtonLabel="Create Entry"
                  clearButtonLabel="Clear"
                  loading={isSubmitting}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinCardPage;