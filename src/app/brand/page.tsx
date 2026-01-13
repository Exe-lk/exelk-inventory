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
import { Employee, hasAdminAccess, isStockKeeper } from '@/types/user';
import { Brand } from '@/types/brand';
import { fetchBrands, createBrand, updateBrand, deleteBrand } from '@/lib/services/brandService';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { Pencil, Eye, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

const BrandPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  usePageTitle('Brand');

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Only allow stockkeepers to access brands
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

  // Fetch brand data
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const brandsData = await fetchBrands();
        setBrands(brandsData);
        
        console.log('Loaded brands:', brandsData.length);
        
      } catch (err) {
        console.error('Error loading brands:', err);
        setError(err instanceof Error ? err.message : 'Failed to load brands');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access brand management.');
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

  // Handle brand deletion - Updated to use modal
  const handleDeleteBrand = async (brand: Brand) => {
    // Set brand to delete and open modal
    setBrandToDelete(brand);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!brandToDelete) return;

    try {
      setIsDeleting(brandToDelete.BrandID);
      await deleteBrand(brandToDelete.BrandID);
      
      // Remove from local state
      setBrands(prev => prev.filter(brand => brand.BrandID !== brandToDelete.BrandID));
      
      // Close modal and clear state
      setIsDeleteModalOpen(false);
      setBrandToDelete(null);
      
      alert('Brand deleted successfully!');
      console.log('Brand deleted successfully');
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert('Failed to delete brand. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setIsDeleteModalOpen(false);
    setBrandToDelete(null);
  };

  // Handle edit brand
  const handleEditBrand = (brand: Brand) => {
    console.log('Edit brand:', brand);
    setSelectedBrand(brand);
    setIsUpdateFormOpen(true);
  };

  // Handle create brand form submission
  const handleCreateBrand = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      console.log('Creating brand with data:', formData);
      
      const brandData = {
        BrandName: formData.brandName,
        Description: formData.description || null,
        Country: formData.country || null,
        IsActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const newBrand = await createBrand(brandData);
      setBrands(prev => [...prev, newBrand]);
      
      setIsCreateFormOpen(false);
      alert('Brand created successfully!');
      
    } catch (err) {
      console.error('Error creating brand:', err);
      alert('Failed to create brand. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update brand form submission
  const handleUpdateBrand = async (formData: Record<string, any>) => {
    if (!selectedBrand) return;
    
    try {
      setIsSubmitting(true);
      
      console.log('Updating brand with data:', formData);
      
      const updateData = {
        BrandName: formData.brandName,
        Description: formData.description,
        Country: formData.country,
        IsActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const updatedBrand = await updateBrand(selectedBrand.BrandID, updateData);
      setBrands(prev => prev.map(brand => 
        brand.BrandID === selectedBrand.BrandID ? updatedBrand : brand
      ));
      
      setIsUpdateFormOpen(false);
      setSelectedBrand(null);
      alert('Brand updated successfully!');
      
    } catch (err) {
      console.error('Error updating brand:', err);
      alert('Failed to update brand. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define form fields for brand creation/editing
  const getFormFields = (isEdit = false): FormField[] => [
    {
      name: 'brandName',
      label: 'Brand Name',
      type: 'text',
      placeholder: 'Enter brand name',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'Brand name must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter brand description (optional)',
      required: false,
      rows: 3
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'Enter country (optional)',
      required: false
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'checkbox',
      required: false
    }
  ];

  // Define table columns
  const columns: TableColumn[] = [
    {
      key: 'BrandID',
      label: 'ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(3, '0')}
        </span>
      )
    },
    {
      key: 'BrandName',
      label: 'Brand',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'Description',
      label: 'Description',
      sortable: true,
      filterable: false,
      render: (value: string | null) => (
        <span className="text-gray-600">
          {value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : 'N/A'}
        </span>
      )
    },
    {
      key: 'Country',
      label: 'Country',
      sortable: true,
      filterable: true,
      render: (value: string | null) => (
        <span className="text-gray-600">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'IsActive',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'CreatedAt',
      label: 'Created Date',
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
    }
  ];

  // Define action buttons for stockkeepers only
  const getActions = (): ActionButton[] => {
    if (!isStockKeeper(currentUser?.RoleID || 0)) {
      return []; // No actions for non-stockkeepers
    }
    
    return [
      {
        label: (
                <span className="flex items-center gap-2">
                  <Pencil size={16} />
                  
                </span>
              ),
        onClick: (brand: Brand) => {
          handleEditBrand(brand);
        },
        variant: 'primary'
      },
      {
        label: (
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                 
                </span>
              ),
        onClick: (brand: Brand) => {
          // Check if currently being deleted
          if (isDeleting === brand.BrandID) {
            return; // Prevent multiple delete attempts
          }
          handleDeleteBrand(brand);
        },
        variant: 'danger'
      }
    ];
  };

  const actions = getActions();

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create brand clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedBrand(null);
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const brandsData = await fetchBrands();
      setBrands(brandsData);
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
            Only stockkeepers can access brand management.
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

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar currentUser={currentUser} onMenuClick={toggleSidebar} />
        <SidebarWrapper
          currentUser={currentUser}
          onLogout={handleLogout} 
          isMobileOpen={isSidebarOpen}
          onMobileClose={closeMobileSidebar}
          onExpandedChange={handleSidebarExpandChange}
        />
        <div className={`pt-[70px] transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'}`}>
          <main className="overflow-y-auto bg-gray-50 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="text-center">
                  <div className="text-red-500 text-xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <div className="space-x-4">
                    <button onClick={refreshData} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Retry
                    </button>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
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
                  <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage product brands and their information
                  </p>
                  {/* Permission indicator */}
                 
                </div>
               
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table
                data={brands}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No brands found. Create your first brand to get started."
                onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                createButtonLabel="Create Brand"
                className="border border-gray-200"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Create Brand Form Popup */}
      {isCreateFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseCreateForm}></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <div className="relative bg-white rounded-lg shadow-xl">
                {/* Close button */}
                <button
                  onClick={handleCloseCreateForm}
                  className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Form */}
                <Form
                  fields={getFormFields(false)}
                  onSubmit={handleCreateBrand}
                  onClear={() => {}}
                  title="Create New Brand"
                  submitButtonLabel="Create Brand"
                  clearButtonLabel="Clear"
                  loading={isSubmitting}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Brand Form Popup */}
      {isUpdateFormOpen && selectedBrand && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseUpdateForm}></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <div className="relative bg-white rounded-lg shadow-xl">
                {/* Close button */}
                <button
                  onClick={handleCloseUpdateForm}
                  className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Update Form */}
                <UpdateForm
                  fields={getFormFields(true)}
                  onSubmit={handleUpdateBrand}
                  title="Update Brand"
                  //updateButtonLabel="Update Brand"
                  loading={isSubmitting}
                  initialData={{
                    brandName: selectedBrand.BrandName,
                    description: selectedBrand.Description || '',
                    country: selectedBrand.Country || '',
                    isActive: selectedBrand.IsActive
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
        title="Delete a Brand"
        message="Are you sure you want to delete that Brand ?"
        warningMessage="By Deleting this, automatically cancel the related fields."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === brandToDelete?.BrandID}
        itemName={brandToDelete?.BrandName}
      />
    </div>
  );
};

export default BrandPage;