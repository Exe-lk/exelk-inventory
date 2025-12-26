'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table, { TableColumn, ActionButton } from '@/components/Table/table';
import SidebarWrapper from '@/components/Common/SidebarWraper';
import Navbar from '@/components/Common/navbar';
import Login from '@/components/login/login';
import UpdateForm from '@/components/form-popup/update';
import DeleteConfirmation from '@/components/form-popup/delete';
import { Employee, hasAdminAccess, isStockKeeper } from '@/types/user';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { fetchProducts } from '@/lib/services/productService';
import { fetchGinDetailsByGinId } from '@/lib/services/gindetailsService';
import { fetchGins, createCompleteGin, updateGin, deleteGin, CreateCompleteGINRequest } from '@/lib/services/ginService';
import { Pencil, Eye, Trash2 } from 'lucide-react';
import { GINDetail } from '@/types/gindetails';


// GIN interface
// interface GIN {
//   ginId: number;
//   ginNumber: string;
//   stockKeeperId: number;
//   issuedTo: string;
//   issueReason: string | null;
//   issueDate: string;
//   remarks: string | null;
//   stockId?: number | null;
//   createdDate?: string;
//   updatedDate?: string;
//   // Enhanced for search context
//   gindetails?: {
//     product?: {
//       productName: string;
//       sku: string;
//     };
//   }[];
// }

interface GIN {
  ginId: number;
  ginNumber: string | null; // Changed from string to string | null
  stockKeeperId?: number; // Made optional
  employeeId?: number; // Added as optional
  issuedTo: string | null; // Changed from string to string | null
  issueReason: string | null;
  issueDate: string | null; // Changed from string to string | null
  remarks: string | null;
  stockId?: number | null;
  createdDate?: string | null; // Changed from string to string | null
  updatedDate?: string | null; // Changed from string to string | null
  // Enhanced for search context
  gindetails?: {
    product?: {
      productName: string;
      sku: string;
    };
  }[];
}

// Product interface
interface Product {
  productId: number;
  sku: string;
  productName: string;
  isActive: boolean;
}

// GIN Detail interface
// interface GINDetail {
//   ginDetailId: number;
//   ginId: number;
//   productId: number;
//   quantityIssued: number;
//   unitCost: number;
//   subTotal: number;
//   location: string | null;
// }

// GIN Detail for form
interface GINDetailFormData {
  productId: string;
  quantityIssued: string;
  unitCost: string;
  location: string;
}

const GinPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [gins, setGins] = useState<GIN[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedGin, setSelectedGin] = useState<GIN | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ginToDelete, setGinToDelete] = useState<GIN | null>(null);

  // View GIN Details states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewGinDetails, setViewGinDetails] = useState<GINDetail[]>([]);
  const [viewingGin, setViewingGin] = useState<GIN | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Enhanced Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Custom form states for GIN creation
  const [ginFormData, setGinFormData] = useState({
    ginNumber: '',
    issuedTo: '',
    issueReason: '',
    issueDate: '',
    remarks: '',
    stockId: ''
  });

  const [ginDetails, setGinDetails] = useState<GINDetailFormData[]>([
    { productId: '', quantityIssued: '', unitCost: '', location: '' }
  ]);

  // Helper function to get product name from ID
  const getProductName = (productID: number): string => {
    const product = products.find(p => p.productId === productID);
    return product ? `${product.productName} (${product.sku})` : `Product ${productID}`;
  };

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
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

  // Fetch data
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all required data in parallel
        const [ginsData, productsData] = await Promise.all([
          fetchGins(),
          fetchProducts()
        ]);
        
        setGins(ginsData);
        setProducts(productsData);
        
        console.log('Loaded data:', {
          gins: ginsData.length,
          products: productsData.length
        });
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // Enhanced Search Handler
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(value);
    }, 500); // 500ms delay
    
    setSearchTimeout(timeout);
  };

  // Enhanced Search Function
  const performSearch = async (searchValue: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Performing enhanced search with term:', searchValue);
      
      // Build search URL
      const searchParams = new URLSearchParams();
      if (searchValue.trim()) {
        searchParams.set('search', searchValue.trim());
      }
      searchParams.set('page', '1'); // Reset to first page when searching
      searchParams.set('limit', '100');
      searchParams.set('sortBy', 'issueDate');
      searchParams.set('sortOrder', 'desc');
      
      const url = `/api/gin${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      console.log(' Enhanced Search URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search GINs');
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.items) {
        const transformedGins = result.data.items.map((item: any) => ({
          ginId: item.ginId,
          ginNumber: item.ginNumber,
          stockKeeperId: item.stockKeeperId,
          issuedTo: item.issuedTo,
          issueReason: item.issueReason,
          issueDate: item.issueDate,
          remarks: item.remarks,
          stockId: item.stockId,
          createdDate: item.createdAt,
          updatedDate: item.updatedAt,
          gindetails: item.gindetails || []
        }));
        setGins(transformedGins);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error(' Error in enhanced search:', err);
      setError(err instanceof Error ? err.message : 'Failed to search GINs');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Handle View GIN Details
  const handleViewGinDetails = async (gin: GIN) => {
    try {
      console.log(' Viewing GIN details for:', gin);
      setViewingGin(gin);
      setIsLoadingDetails(true);
      setIsViewModalOpen(true);
      
      // Fetch GIN details
      const details = await fetchGinDetailsByGinId(gin.ginId);
      console.log(' Fetched GIN details:', details);
      setViewGinDetails(details);
      
    } catch (error) {
      console.error(' Error fetching GIN details:', error);
      alert('Failed to load GIN details. Please try again.');
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingGin(null);
    setViewGinDetails([]);
    setIsLoadingDetails(false);
  };

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access GIN management.');
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

  // Handle GIN deletion
  const handleDeleteGin = async (gin: GIN) => {
    setGinToDelete(gin);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!ginToDelete) return;

    try {
      setIsDeleting(ginToDelete.ginId);
      
      await deleteGin(ginToDelete.ginId);
      
      setGins(prev => prev.filter(gin => gin.ginId !== ginToDelete.ginId));
      
      setIsDeleteModalOpen(false);
      setGinToDelete(null);
      
      alert('GIN deleted successfully!');
    } catch (err) {
      console.error('Error deleting GIN:', err);
      alert('Failed to delete GIN. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setGinToDelete(null);
  };

  // Handle edit GIN
  const handleEditGin = (gin: GIN) => {
    console.log('Edit GIN:', gin);
    setSelectedGin(gin);
    setIsUpdateFormOpen(true);
  };

  // Handle GIN form data change
  const handleGinFormChange = (field: string, value: string) => {
    setGinFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle GIN detail change
  const handleDetailChange = (index: number, field: string, value: string) => {
    setGinDetails(prev => {
      const newDetails = [...prev];
      newDetails[index] = {
        ...newDetails[index],
        [field]: value
      };
      return newDetails;
    });
  };

  // Add new GIN detail
  const addGinDetail = () => {
    setGinDetails(prev => [
      ...prev,
      { productId: '', quantityIssued: '', unitCost: '', location: '' }
    ]);
  };

  // Remove GIN detail
  const removeGinDetail = (index: number) => {
    if (ginDetails.length > 1) {
      setGinDetails(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Calculate total amount from details
  const calculateTotalAmount = () => {
    return ginDetails.reduce((total, detail) => {
      if (detail.quantityIssued && detail.unitCost) {
        const qty = parseInt(detail.quantityIssued);
        const cost = parseFloat(detail.unitCost);
        if (!isNaN(qty) && !isNaN(cost)) {
          return total + (qty * cost);
        }
      }
      return total;
    }, 0);
  };

  // Handle create complete GIN form submission
  const handleCreateCompleteGin = async () => {
    try {
      setIsSubmitting(true);

      // Validate main GIN data
      if (!ginFormData.ginNumber || !ginFormData.issuedTo || !ginFormData.issueDate) {
        alert('Please fill in all required GIN fields (GIN Number, Issued To, Issue Date)');
        return;
      }

      // Validate GIN details
      const validDetails = ginDetails.filter(detail => 
        detail.productId && detail.quantityIssued && detail.unitCost
      );

      if (validDetails.length === 0) {
        alert('At least one complete GIN detail is required (Product, Quantity, Unit Cost)');
        return;
      }

      const ginDetailsData = validDetails.map(detail => ({
        productId: parseInt(detail.productId),
        quantityIssued: parseInt(detail.quantityIssued),
        unitCost: parseFloat(detail.unitCost),
        location: detail.location || undefined
      }));

      const completeGinData: CreateCompleteGINRequest = {
        ginNumber: ginFormData.ginNumber,
        issuedTo: ginFormData.issuedTo,
        issueReason: ginFormData.issueReason || undefined,
        issueDate: ginFormData.issueDate,
        remarks: ginFormData.remarks || undefined,
        stockId: ginFormData.stockId ? parseInt(ginFormData.stockId) : undefined,
        ginDetails: ginDetailsData
      };

      console.log('Creating complete GIN with data:', completeGinData);

      const result = await createCompleteGin(completeGinData);

      // Add the created GIN to the local state
      if (result?.gin) {
        setGins(prev => [...prev, result.gin]);
      }

      // Reset form
      setGinFormData({
        ginNumber: '',
        issuedTo: '',
        issueReason: '',
        issueDate: '',
        remarks: '',
        stockId: ''
      });
      setGinDetails([
        { productId: '', quantityIssued: '', unitCost: '', location: '' }
      ]);

      setIsCreateFormOpen(false);
      alert(`Complete GIN created successfully!\nGIN ID: ${result?.gin?.ginId}\nDetails Created: ${result?.totalDetailsCreated || 0}`);

    } catch (err) {
      console.error('Error creating complete GIN:', err);
      alert('Failed to create complete GIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update GIN form submission
  const handleUpdateGin = async (formData: Record<string, any>) => {
    if (!selectedGin) return;
    
    try {
      setIsSubmitting(true);
      
      const updateData = {
        ginNumber: formData.ginNumber,
        issuedTo: formData.issuedTo,
        issueReason: formData.issueReason,
        issueDate: formData.issueDate,
        remarks: formData.remarks,
        stockId: formData.stockId ? parseInt(formData.stockId) : undefined
      };
      
      const updatedGin = await updateGin(selectedGin.ginId, updateData);

      setGins(prev => prev.map(gin => 
        gin.ginId === selectedGin.ginId ? updatedGin : gin
      ));
      
      setIsUpdateFormOpen(false);
      setSelectedGin(null);
      alert('GIN updated successfully!');
      
    } catch (err) {
      console.error('Error updating GIN:', err);
      alert('Failed to update GIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define simple form fields for GIN editing
  const getUpdateFormFields = () => [
    {
      name: 'ginNumber',
      label: 'GIN Number',
      type: 'text' as const,
      placeholder: 'Enter GIN number',
      required: true
    },
    {
      name: 'issuedTo',
      label: 'Issued To',
      type: 'text' as const,
      placeholder: 'Enter issued to (person/department)',
      required: true
    },
    {
      name: 'issueReason',
      label: 'Issue Reason',
      type: 'text' as const,
      placeholder: 'Enter issue reason',
      required: false
    },
    {
      name: 'issueDate',
      label: 'Issue Date',
      type: 'date' as const,
      placeholder: 'Select issue date',
      required: true
    },
    {
      name: 'remarks',
      label: 'Remarks',
      type: 'textarea' as const,
      placeholder: 'Enter remarks (optional)',
      required: false,
      rows: 3
    },
    {
      name: 'stockId',
      label: 'Stock ID',
      type: 'number' as const,
      placeholder: 'Enter stock ID',
      required: false
    }
  ];

  // Enhanced Table Columns with Search Context
  const columns: TableColumn[] = [
    {
      key: 'ginId',
      label: 'GIN ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(4, '0')}
        </span>
      )
    },
    {
      key: 'ginNumber',
      label: 'GIN Number',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <span className="font-medium text-gray-600">{value}</span>
          {searchTerm && row.gindetails && row.gindetails.length > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              Products: {row.gindetails.slice(0, 2).map((detail: any) => detail.product?.productName || 'Unknown').join(', ')}
              {row.gindetails.length > 2 && ` +${row.gindetails.length - 2} more`}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'issuedTo',
      label: 'Issued To',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'issueReason',
      label: 'Issue Reason',
      sortable: true,
      filterable: true,
      render: (value: string | null) => (
        <span className="text-gray-600">
          {value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 'N/A'}
        </span>
      )
    },
    {
      key: 'stockKeeperId',
      label: 'Stock Keeper',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="text-gray-600">ID: {value}</span>
      )
    },
    {
      key: 'issueDate',
      label: 'Issue Date',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-600">
          {value ? new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A'}
        </span>
      )
    },
    {
      key: 'remarks',
      label: 'Remarks',
      sortable: false,
      filterable: false,
      render: (value: string | null) => (
        <span className="text-gray-600">
          {value ? (value.length > 30 ? `${value.substring(0, 30)}...` : value) : 'N/A'}
        </span>
      )
    }
  ];

  // Define action buttons for stockkeepers only
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
        onClick: (gin: GIN) => {
          if (isDeleting === gin.ginId) {
            return;
          }
          handleViewGinDetails(gin);
        },
        variant: 'secondary'
      },
      {
        label: (
                <span className="flex items-center gap-2">
                  <Pencil size={16} />
                  
                </span>
              ),
        onClick: (gin: GIN) => {
          if (isDeleting === gin.ginId) {
            return;
          }
          handleEditGin(gin);
        },
        variant: 'primary'
      },
      {
        label: (
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  
                </span>
              ),
        onClick: (gin: GIN) => {
          if (isDeleting === gin.ginId) {
            return;
          }
          handleDeleteGin(gin);
        },
        variant: 'danger'
      }
    ];
  };

  const actions = getActions();

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create GIN clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
    // Reset form data
    setGinFormData({
      ginNumber: '',
      issuedTo: '',
      issueReason: '',
      issueDate: '',
      remarks: '',
      stockId: ''
    });
    setGinDetails([
      { productId: '', quantityIssued: '', unitCost: '', location: '' }
    ]);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedGin(null);
  };

  // Show loading spinner during auth check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-4xl mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Only stockkeepers can access GIN management.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
        <main className="overflow-y-auto bg-gray-50 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
          <div className="max-w-full">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">GIN Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage Goods Issue Notes and track internal inventory distribution
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="mb-6">
              <div className="max-w-md">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search GINs
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by GIN number, issued to, product name, or issue reason..."
                  />
                </div>
                {searchTerm && (
                  <p className="mt-1 text-sm text-gray-500">
                    🔍 Searching GINs, issued to, and products for: "{searchTerm}"
                  </p>
                )}
              </div>
            </div>

            {error ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                  <div className="text-center">
                    <div className="text-red-500 text-xl mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <Table
                  data={gins}
                  columns={columns}
                  actions={actions}
                  itemsPerPage={10}
                  searchable={false} // We're using custom search
                  filterable={true}
                  loading={loading}
                  emptyMessage="No GIN records found. Create your first GIN to get started."
                  onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                  createButtonLabel="Create GIN"
                  className="border border-gray-200"
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* View GIN Details Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseViewModal}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">GIN Details</h2>
                      {viewingGin && (
                        <p className="text-sm text-gray-500 mt-1">
                          {viewingGin.ginNumber} • Issued To: {viewingGin.issuedTo} • 
                          Date: {viewingGin.issueDate ? new Date(viewingGin.issueDate).toLocaleDateString() : 'N/A'}
                        </p>
                      )}
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
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-500">Loading GIN details...</p>
                      </div>
                    </div>
                  ) : viewGinDetails.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-xl mb-4">📄</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Details Found</h3>
                      <p className="text-gray-500">This GIN doesn't have any details yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* GIN Summary */}
                      {viewingGin && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-3">GIN Summary</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">GIN Number</label>
                              <p className="text-sm text-gray-900 font-medium">{viewingGin.ginNumber}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Issued To</label>
                              <p className="text-sm text-gray-900">{viewingGin.issuedTo}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                              <p className="text-sm text-gray-900">
                                {viewingGin.issueDate 
                                  ? new Date(viewingGin.issueDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })
                                  : 'N/A'}
                              </p>
                            </div>
                            {viewingGin.issueReason && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Issue Reason</label>
                                <p className="text-sm text-gray-900">{viewingGin.issueReason}</p>
                              </div>
                            )}
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Stock Keeper ID</label>
                              <p className="text-sm text-gray-900">{viewingGin.stockKeeperId}</p>
                            </div>
                            {viewingGin.remarks && (
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                                <p className="text-sm text-gray-900">{viewingGin.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* GIN Details Table */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          GIN Details ({viewGinDetails.length} items)
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Detail ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Quantity Issued
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Unit Cost
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Subtotal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Location
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {viewGinDetails.map((detail, index) => (
                                <tr key={detail.ginDetailId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {String(detail.ginDetailId).padStart(4, '0')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {getProductName(detail.productId)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Product ID: {detail.productId}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {detail.quantityIssued?.toLocaleString() || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    LKR {detail.unitCost?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    }) || '0.00'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    LKR {(detail.subTotal ?? 0).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {detail.location || 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                              <tr>
                                <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                  Total Value:
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                  LKR {viewGinDetails.reduce((total, detail) => total + (detail.subTotal ?? 0), 0).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </td>
                                <td className="px-6 py-4"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={handleCloseViewModal}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Create GIN Form Modal */}
      {isCreateFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseCreateForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Create Complete GIN</h2>
                    <button
                      onClick={handleCloseCreateForm}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4">
                  {/* GIN Information Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">GIN Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GIN Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={ginFormData.ginNumber}
                          onChange={(e) => handleGinFormChange('ginNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter GIN number (e.g., GIN-2025-001)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issued To <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={ginFormData.issuedTo}
                          onChange={(e) => handleGinFormChange('issuedTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter person/department name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issue Reason
                        </label>
                        <input
                          type="text"
                          value={ginFormData.issueReason}
                          onChange={(e) => handleGinFormChange('issueReason', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter reason for issuing goods"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issue Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={ginFormData.issueDate}
                          onChange={(e) => handleGinFormChange('issueDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock ID (Optional)
                        </label>
                        <input
                          type="number"
                          value={ginFormData.stockId}
                          onChange={(e) => handleGinFormChange('stockId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter stock ID"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remarks
                        </label>
                        <textarea
                          value={ginFormData.remarks}
                          onChange={(e) => handleGinFormChange('remarks', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter remarks (optional)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GIN Details Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">GIN Details</h3>
                      <button
                        onClick={addGinDetail}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add Product
                      </button>
                    </div>

                    <div className="space-y-4">
                      {ginDetails.map((detail, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-700">Product Item {index + 1}</h4>
                            {ginDetails.length > 1 && (
                              <button
                                onClick={() => removeGinDetail(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={detail.productId}
                                onChange={(e) => handleDetailChange(index, 'productId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select product</option>
                                {products.filter(p => p.isActive).map(product => (
                                  <option key={product.productId} value={product.productId}>
                                    {product.productName} ({product.sku})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity Issued <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={detail.quantityIssued}
                                onChange={(e) => handleDetailChange(index, 'quantityIssued', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Quantity to issue"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Cost <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={detail.unitCost}
                                onChange={(e) => handleDetailChange(index, 'unitCost', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Unit cost"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                              </label>
                              <input
                                type="text"
                                value={detail.location}
                                onChange={(e) => handleDetailChange(index, 'location', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Location/Warehouse"
                              />
                            </div>
                          </div>

                          {detail.quantityIssued && detail.unitCost && (
                            <div className="mt-2 text-sm text-gray-600">
                              Subtotal: LKR {(parseInt(detail.quantityIssued) * parseFloat(detail.unitCost)).toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">
                        Total Value: LKR {calculateTotalAmount().toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={handleCloseCreateForm}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCompleteGin}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create GIN'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update GIN Form Popup */}
      {isUpdateFormOpen && selectedGin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseUpdateForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <div className="relative bg-white rounded-lg shadow-xl">
                <button
                  onClick={handleCloseUpdateForm}
                  className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <UpdateForm
                  fields={getUpdateFormFields()}
                  onSubmit={handleUpdateGin}
                  title="Update GIN"
                  loading={isSubmitting}
                  initialData={{
                    ginNumber: selectedGin.ginNumber,
                    issuedTo: selectedGin.issuedTo,
                    issueReason: selectedGin.issueReason || '',
                    issueDate: selectedGin.issueDate,
                    remarks: selectedGin.remarks || '',
                    stockId: selectedGin.stockId?.toString() || ''
                  }}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete GIN"
        message="Are you sure you want to delete this GIN?"
        warningMessage="By deleting this GIN, all related details will also be removed."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === ginToDelete?.ginId}
        itemName={ginToDelete?.ginNumber ?? undefined}
      />
    </div>
  );
};

export default GinPage;