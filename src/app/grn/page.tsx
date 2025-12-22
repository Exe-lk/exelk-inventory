
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
import { fetchSuppliers } from '@/lib/services/supplierService';
import { fetchProducts } from '@/lib/services/productService';
import { fetchGrnDetailsByGrnId } from '@/lib/services/grndetailsService';

// GRN interface
interface GRN {
  grnId: number;
  grnNumber: string;
  supplierId: number;
  stockKeeperId: number;
  receivedDate: string;
  totalAmount: number;
  remarks: string | null;
  stockId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  // Enhanced for search context
  grndetails?: {
    product?: {
      productName: string;
      sku: string;
    };
  }[];
}

// Supplier interface
interface Supplier {
  SupplierID: number;
  SupplierName: string;
  IsActive: boolean;
}

// Product interface
interface Product {
  productId: number;
  sku: string;
  productName: string;
  isActive: boolean;
}

// GRN Detail interface
interface GRNDetail {
  grnDetailId: number;
  grnId: number;
  productId: number;
  quantityReceived: number;
  unitCost: number;
  subTotal: number;
  location: string | null;
}

// GRN Detail for form
interface GRNDetailFormData {
  productId: string;
  quantityReceived: string;
  unitCost: string;
  location: string;
}

// Create Complete GRN request interface
interface CreateCompleteGRNRequest {
  grnNumber: string;
  supplierId: number;
  receivedDate: string;
  totalAmount?: number;
  remarks?: string;
  stockId?: number;
  grnDetails: {
    productId: number;
    quantityReceived: number;
    unitCost: number;
    location?: string;
  }[];
}

const GrnPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [grns, setGrns] = useState<GRN[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GRN | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [grnToDelete, setGrnToDelete] = useState<GRN | null>(null);

  // View GRN Details states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewGrnDetails, setViewGrnDetails] = useState<GRNDetail[]>([]);
  const [viewingGrn, setViewingGrn] = useState<GRN | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Enhanced Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Custom form states for GRN creation
  const [grnFormData, setGrnFormData] = useState({
    grnNumber: '',
    supplierId: '',
    receivedDate: '',
    totalAmount: '',
    remarks: '',
    stockId: ''
  });

  const [grnDetails, setGrnDetails] = useState<GRNDetailFormData[]>([
    { productId: '', quantityReceived: '', unitCost: '', location: '' }
  ]);

  // Helper functions to get names from IDs
  const getSupplierName = (supplierID: number): string => {
    const supplier = suppliers.find(s => s.SupplierID === supplierID);
    return supplier ? supplier.SupplierName : `Supplier ${supplierID}`;
  };

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
        const [grnsData, suppliersData, productsData] = await Promise.all([
          fetchGrns(),
          fetchSuppliers(),
          fetchProducts()
        ]);
        
        setGrns(grnsData);
        setSuppliers(suppliersData);
        setProducts(productsData);
        
        console.log('Loaded data:', {
          grns: grnsData.length,
          suppliers: suppliersData.length,
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
      searchParams.set('sortBy', 'receivedDate');
      searchParams.set('sortOrder', 'desc');
      
      const url = `/api/grn${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      console.log('🌐 Enhanced Search URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search GRNs');
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.items) {
        console.log(`📋 Enhanced search results: ${result.data.items.length} GRNs found`);
        console.log('🔍 Search results with product context:', result.data.items);
        setGrns(result.data.items);
      } else {
        throw new Error('Invalid search response format');
      }
      
    } catch (err) {
      console.error('❌ Error in enhanced search:', err);
      setError(err instanceof Error ? err.message : 'Failed to search GRNs');
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

  // Fetch GRNs function
  const fetchGrns = async (): Promise<GRN[]> => {
    try {
      const response = await fetch('/api/grn', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch GRNs');
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.items) {
        return result.data.items;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching GRNs:', error);
      throw error;
    }
  };

  // Create complete GRN function
  const createCompleteGrn = async (data: CreateCompleteGRNRequest): Promise<any> => {
    try {
      const response = await fetch('/api/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create GRN');
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error creating GRN:', error);
      throw error;
    }
  };

  // Handle View GRN Details
  const handleViewGrnDetails = async (grn: GRN) => {
    try {
      console.log('🔍 Viewing GRN details for:', grn);
      setViewingGrn(grn);
      setIsLoadingDetails(true);
      setIsViewModalOpen(true);
      
      // Fetch GRN details
      const details = await fetchGrnDetailsByGrnId(grn.grnId);
      console.log('📋 Fetched GRN details:', details);
      setViewGrnDetails(details);
      
    } catch (error) {
      console.error('❌ Error fetching GRN details:', error);
      alert('Failed to load GRN details. Please try again.');
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingGrn(null);
    setViewGrnDetails([]);
    setIsLoadingDetails(false);
  };

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access GRN management.');
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

  // Handle GRN deletion
  const handleDeleteGrn = async (grn: GRN) => {
    setGrnToDelete(grn);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!grnToDelete) return;

    try {
      setIsDeleting(grnToDelete.grnId);
      
      const response = await fetch(`/api/grn?id=${grnToDelete.grnId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete GRN');
      }
      
      setGrns(prev => prev.filter(grn => grn.grnId !== grnToDelete.grnId));
      
      setIsDeleteModalOpen(false);
      setGrnToDelete(null);
      
      alert('GRN deleted successfully!');
    } catch (err) {
      console.error('Error deleting GRN:', err);
      alert('Failed to delete GRN. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setGrnToDelete(null);
  };

  // Handle edit GRN
  const handleEditGrn = (grn: GRN) => {
    console.log('Edit GRN:', grn);
    setSelectedGrn(grn);
    setIsUpdateFormOpen(true);
  };

  // Handle GRN form data change
  const handleGrnFormChange = (field: string, value: string) => {
    setGrnFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle GRN detail change
  const handleDetailChange = (index: number, field: string, value: string) => {
    setGrnDetails(prev => {
      const newDetails = [...prev];
      newDetails[index] = {
        ...newDetails[index],
        [field]: value
      };
      return newDetails;
    });
  };

  // Add new GRN detail
  const addGrnDetail = () => {
    setGrnDetails(prev => [
      ...prev,
      { productId: '', quantityReceived: '', unitCost: '', location: '' }
    ]);
  };

  // Remove GRN detail
  const removeGrnDetail = (index: number) => {
    if (grnDetails.length > 1) {
      setGrnDetails(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Calculate total amount from details
  const calculateTotalAmount = () => {
    return grnDetails.reduce((total, detail) => {
      if (detail.quantityReceived && detail.unitCost) {
        const qty = parseInt(detail.quantityReceived);
        const cost = parseFloat(detail.unitCost);
        if (!isNaN(qty) && !isNaN(cost)) {
          return total + (qty * cost);
        }
      }
      return total;
    }, 0);
  };

  // Handle create complete GRN form submission
  const handleCreateCompleteGrn = async () => {
    try {
      setIsSubmitting(true);

      // Validate main GRN data
      if (!grnFormData.grnNumber || !grnFormData.supplierId || !grnFormData.receivedDate) {
        alert('Please fill in all required GRN fields (GRN Number, Supplier, Received Date)');
        return;
      }

      // Validate GRN details
      const validDetails = grnDetails.filter(detail => 
        detail.productId && detail.quantityReceived && detail.unitCost
      );

      if (validDetails.length === 0) {
        alert('At least one complete GRN detail is required (Product, Quantity, Unit Cost)');
        return;
      }

      const grnDetailsData = validDetails.map(detail => ({
        productId: parseInt(detail.productId),
        quantityReceived: parseInt(detail.quantityReceived),
        unitCost: parseFloat(detail.unitCost),
        location: detail.location || undefined
      }));

      const completeGrnData: CreateCompleteGRNRequest = {
        grnNumber: grnFormData.grnNumber,
        supplierId: parseInt(grnFormData.supplierId),
        receivedDate: grnFormData.receivedDate,
        totalAmount: grnFormData.totalAmount ? parseFloat(grnFormData.totalAmount) : undefined,
        remarks: grnFormData.remarks || undefined,
        stockId: grnFormData.stockId ? parseInt(grnFormData.stockId) : undefined,
        grnDetails: grnDetailsData
      };

      console.log('Creating complete GRN with data:', completeGrnData);

      const result = await createCompleteGrn(completeGrnData);

      // Add the created GRN to the local state
      if (result?.grn) {
        setGrns(prev => [...prev, result.grn]);
      }

      // Reset form
      setGrnFormData({
        grnNumber: '',
        supplierId: '',
        receivedDate: '',
        totalAmount: '',
        remarks: '',
        stockId: ''
      });
      setGrnDetails([
        { productId: '', quantityReceived: '', unitCost: '', location: '' }
      ]);

      setIsCreateFormOpen(false);
      alert(`Complete GRN created successfully!\nGRN ID: ${result?.grn?.grnId}\nDetails Created: ${result?.totalDetailsCreated || 0}\nTotal Amount: LKR ${result?.grn?.totalAmount || 0}`);

    } catch (err) {
      console.error('Error creating complete GRN:', err);
      alert('Failed to create complete GRN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update GRN form submission
  const handleUpdateGrn = async (formData: Record<string, any>) => {
    if (!selectedGrn) return;
    
    try {
      setIsSubmitting(true);
      
      const updateData = {
        grnNumber: formData.grnNumber,
        supplierId: parseInt(formData.supplierId),
        receivedDate: formData.receivedDate,
        totalAmount: parseFloat(formData.totalAmount),
        remarks: formData.remarks,
        stockId: formData.stockId ? parseInt(formData.stockId) : null
      };
      
      const response = await fetch(`/api/grn?id=${selectedGrn.grnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update GRN');
      }

      const result = await response.json();
      const updatedGrn = result.data;

      setGrns(prev => prev.map(grn => 
        grn.grnId === selectedGrn.grnId ? updatedGrn : grn
      ));
      
      setIsUpdateFormOpen(false);
      setSelectedGrn(null);
      alert('GRN updated successfully!');
      
    } catch (err) {
      console.error('Error updating GRN:', err);
      alert('Failed to update GRN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define simple form fields for GRN editing
  const getUpdateFormFields = () => [
    {
      name: 'grnNumber',
      label: 'GRN Number',
      type: 'text' as const,
      placeholder: 'Enter GRN number',
      required: true
    },
    {
      name: 'supplierId',
      label: 'Supplier',
      type: 'select' as const,
      placeholder: 'Select supplier',
      required: true,
      options: suppliers
        .filter(supplier => supplier.IsActive)
        .map(supplier => ({
          label: supplier.SupplierName,
          value: supplier.SupplierID.toString()
        }))
    },
    {
      name: 'receivedDate',
      label: 'Received Date',
      type: 'date' as const,
      placeholder: 'Select received date',
      required: true
    },
    {
      name: 'totalAmount',
      label: 'Total Amount',
      type: 'number' as const,
      placeholder: 'Enter total amount',
      required: true,
      step: '0.01'
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
      key: 'grnId',
      label: 'GRN ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(4, '0')}
        </span>
      )
    },
    {
      key: 'grnNumber',
      label: 'GRN Number',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div>
          <span className="font-medium text-gray-600">{value}</span>
          {/* Show matched products when searching */}
          {searchTerm && row.grndetails && row.grndetails.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Products: {row.grndetails
                .map((detail: any) => detail.product?.productName)
                .filter(Boolean)
                .slice(0, 2) // Show first 2 products
                .join(', ')}
              {row.grndetails.length > 2 && ` +${row.grndetails.length - 2} more`}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {getSupplierName(value)}
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
      key: 'receivedDate',
      label: 'Received Date',
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
      key: 'totalAmount',
      label: 'Total Amount',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-600">
          LKR {value ? value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }) : '0.00'}
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
        label: 'View',
        onClick: (grn: GRN) => {
          if (isDeleting === grn.grnId) {
            return;
          }
          handleViewGrnDetails(grn);
        },
        variant: 'secondary'
      },
      {
        label: 'Update',
        onClick: (grn: GRN) => {
          if (isDeleting === grn.grnId) {
            return;
          }
          handleEditGrn(grn);
        },
        variant: 'primary'
      },
      {
        label: 'Delete',
        onClick: (grn: GRN) => {
          if (isDeleting === grn.grnId) {
            return;
          }
          handleDeleteGrn(grn);
        },
        variant: 'danger'
      }
    ];
  };

  const actions = getActions();

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create GRN clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
    // Reset form data
    setGrnFormData({
      grnNumber: '',
      supplierId: '',
      receivedDate: '',
      totalAmount: '',
      remarks: '',
      stockId: ''
    });
    setGrnDetails([
      { productId: '', quantityReceived: '', unitCost: '', location: '' }
    ]);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedGrn(null);
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
          <div className="text-red-500 text-4xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Only stockkeepers can access GRN management.
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
                  <h1 className="text-3xl font-bold text-gray-900">GRN Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage Goods Receipt Notes and track inventory receipts
                  </p>
                </div>
              </div>
            </div>

            {error ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                  <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️</div>
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
              <>
                {/* Enhanced Search Section */}
                <div className="mb-6 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Search GRNs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Combined Search Input */}
                    <div className="lg:col-span-2">
                      <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                        Search by GRN Number or Product Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="search"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="Enter GRN number (e.g., GRN-2025-001) or product name (e.g., iPhone 13)"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        {searchTerm && (
                          <button
                            onClick={() => handleSearchChange('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                    </div>
                    
                    
                  </div>
                </div>

                {/* Updated Table Component - Removed built-in search */}
                <div className="bg-white rounded-lg shadow">
                  <Table
                    data={grns}
                    columns={columns}
                    actions={actions}
                    itemsPerPage={10}
                    searchable={false} // Disable built-in search since we have custom search
                    filterable={true}
                    loading={loading}
                    emptyMessage={
                      searchTerm 
                        ? `No GRNs found matching "${searchTerm}". Try searching with a different GRN number or product name.`
                        : "No GRN records found. Create your first GRN to get started."
                    }
                    onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                    createButtonLabel="Create GRN"
                    className="border border-gray-200"
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* View GRN Details Modal */}
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
                      <h2 className="text-xl font-semibold text-gray-900">GRN Details</h2>
                      {viewingGrn && (
                        <p className="text-sm text-gray-500 mt-1">
                          {viewingGrn.grnNumber} • Supplier: {getSupplierName(viewingGrn.supplierId)} • 
                          Date: {new Date(viewingGrn.receivedDate).toLocaleDateString()}
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
                        <p className="text-gray-500">Loading GRN details...</p>
                      </div>
                    </div>
                  ) : viewGrnDetails.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-xl mb-4">📄</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Details Found</h3>
                      <p className="text-gray-500">This GRN doesn't have any details yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* GRN Summary */}
                      {viewingGrn && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-3">GRN Summary</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">GRN Number</label>
                              <p className="text-sm text-gray-900 font-medium">{viewingGrn.grnNumber}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Supplier</label>
                              <p className="text-sm text-gray-900">{getSupplierName(viewingGrn.supplierId)}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Received Date</label>
                              <p className="text-sm text-gray-900">
                                {new Date(viewingGrn.receivedDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                              <p className="text-sm text-gray-900 font-medium">
                                LKR {viewingGrn.totalAmount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Stock Keeper ID</label>
                              <p className="text-sm text-gray-900">{viewingGrn.stockKeeperId}</p>
                            </div>
                            {viewingGrn.remarks && (
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                                <p className="text-sm text-gray-900">{viewingGrn.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* GRN Details Table */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          GRN Details ({viewGrnDetails.length} items)
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
                                  Quantity
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
                              {viewGrnDetails.map((detail, index) => (
                                <tr key={detail.grnDetailId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {String(detail.grnDetailId).padStart(4, '0')}
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
                                    {detail.quantityReceived?.toLocaleString() || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    LKR {detail.unitCost?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    }) || '0.00'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    LKR {detail.subTotal?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    }) || '0.00'}
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
                                  Total Amount:
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                  LKR {viewGrnDetails.reduce((total, detail) => total + (detail.subTotal || 0), 0).toLocaleString('en-US', {
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

      {/* Custom Create GRN Form Modal */}
      {isCreateFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseCreateForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Create Complete GRN</h2>
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
                  {/* GRN Information Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">GRN Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GRN Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={grnFormData.grnNumber}
                          onChange={(e) => handleGrnFormChange('grnNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter GRN number (e.g., GRN-2025-001)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={grnFormData.supplierId}
                          onChange={(e) => handleGrnFormChange('supplierId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select supplier</option>
                          {suppliers.filter(s => s.IsActive).map(supplier => (
                            <option key={supplier.SupplierID} value={supplier.SupplierID}>
                              {supplier.SupplierName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Received Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={grnFormData.receivedDate}
                          onChange={(e) => handleGrnFormChange('receivedDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Amount (Optional)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={grnFormData.totalAmount}
                          onChange={(e) => handleGrnFormChange('totalAmount', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Auto-calculated: LKR ${calculateTotalAmount().toFixed(2)}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock ID (Optional)
                        </label>
                        <input
                          type="number"
                          value={grnFormData.stockId}
                          onChange={(e) => handleGrnFormChange('stockId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter stock ID"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remarks
                        </label>
                        <textarea
                          value={grnFormData.remarks}
                          onChange={(e) => handleGrnFormChange('remarks', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter remarks (optional)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GRN Details Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">GRN Details</h3>
                      <button
                        onClick={addGrnDetail}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add Product
                      </button>
                    </div>

                    <div className="space-y-4">
                      {grnDetails.map((detail, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-700">GRN Product {index + 1}</h4>
                            {grnDetails.length > 1 && (
                              <button
                                onClick={() => removeGrnDetail(index)}
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
                                Quantity <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={detail.quantityReceived}
                                onChange={(e) => handleDetailChange(index, 'quantityReceived', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Quantity"
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
                                placeholder="Location ID"
                              />
                            </div>
                          </div>

                          {detail.quantityReceived && detail.unitCost && (
                            <div className="mt-2 text-sm text-gray-600">
                              Subtotal: LKR {(parseInt(detail.quantityReceived) * parseFloat(detail.unitCost)).toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">
                        Total Amount: LKR {calculateTotalAmount().toFixed(2)}
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
                    onClick={handleCreateCompleteGrn}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create GRN'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update GRN Form Popup */}
      {isUpdateFormOpen && selectedGrn && (
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
                   onSubmit={handleUpdateGrn}
                   title="Update GRN"
                   loading={isSubmitting}
                  initialData={{
                    grnNumber: selectedGrn.grnNumber,
                    supplierId: selectedGrn.supplierId.toString(),
                    receivedDate: selectedGrn.receivedDate,
                    totalAmount: selectedGrn.totalAmount.toString(),
                    remarks: selectedGrn.remarks || '',
                    stockId: selectedGrn.stockId?.toString() || ''
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
        title="Delete GRN"
        message="Are you sure you want to delete this GRN?"
        warningMessage="By deleting this GRN, all related details will also be removed."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === grnToDelete?.grnId}
        itemName={grnToDelete?.grnNumber}
      />
    </div>
  );
};

export default GrnPage;
