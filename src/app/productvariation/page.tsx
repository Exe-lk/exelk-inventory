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
import { ProductVariation } from '@/types/productvariation';
import { fetchProductVariations, createProductVariation, updateProductVariation, deleteProductVariation } from '@/lib/services/productvariationService';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { Pencil, Eye, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

const ProductVariationPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [productVariations, setProductVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedProductVariation, setSelectedProductVariation] = useState<ProductVariation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productVariationToDelete, setProductVariationToDelete] = useState<ProductVariation | null>(null);
  usePageTitle('Product Variation');

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

  // Fetch product variation data
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productVariationsData = await fetchProductVariations();
        setProductVariations(productVariationsData);
        
        console.log('Loaded product variations:', productVariationsData.length);
        
      } catch (err) {
        console.error('Error loading product variations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product variations');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access product variation management.');
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

  // Handle product variation deletion
  const handleDeleteProductVariation = async (productVariation: ProductVariation) => {
    setProductVariationToDelete(productVariation);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!productVariationToDelete) return;

    try {
      setIsDeleting(productVariationToDelete.variationId);
      await deleteProductVariation(productVariationToDelete.variationId);
      
      setProductVariations(prev => prev.filter(variation => variation.variationId !== productVariationToDelete.variationId));
      
      setIsDeleteModalOpen(false);
      setProductVariationToDelete(null);
      
      alert('Product variation deleted successfully!');
      console.log('Product variation deleted successfully');
    } catch (err) {
      console.error('Error deleting product variation:', err);
      alert('Failed to delete product variation. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setProductVariationToDelete(null);
  };

  // Handle edit product variation
  const handleEditProductVariation = (productVariation: ProductVariation) => {
    console.log('Edit product variation:', productVariation);
    setSelectedProductVariation(productVariation);
    setIsUpdateFormOpen(true);
  };

  // Handle create product variation form submission
  const handleCreateProductVariation = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      console.log('Creating product variation with data:', formData);
      
      const productVariationData = {
        versionId: parseInt(formData.versionId),
        variationName: formData.variationName,
        color: formData.color || '',
        size: formData.size || '',
        capacity: formData.capacity || '',
        barcode: formData.barcode || '',
        price: parseFloat(formData.price) || 0,
        quantity: parseInt(formData.quantity) || 0,
        minStockLevel: parseInt(formData.minStockLevel) || 0,
        maxStockLevel: parseInt(formData.maxStockLevel) || 0,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        createdBy: currentUser?.EmployeeID || 1
      };
      
      const newProductVariation = await createProductVariation(productVariationData);
      setProductVariations(prev => [...prev, newProductVariation]);
      
      setIsCreateFormOpen(false);
      alert('Product variation created successfully!');
      
    } catch (err) {
      console.error('Error creating product variation:', err);
      alert('Failed to create product variation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update product variation form submission
  const handleUpdateProductVariation = async (formData: Record<string, any>) => {
    if (!selectedProductVariation) return;
    
    try {
      setIsSubmitting(true);
      
      console.log('Updating product variation with data:', formData);
      
      const updateData = {
        versionId: parseInt(formData.versionId),
        variationName: formData.variationName,
        color: formData.color || '',
        size: formData.size || '',
        capacity: formData.capacity || '',
        barcode: formData.barcode || '',
        price: parseFloat(formData.price) || 0,
        quantity: parseInt(formData.quantity) || 0,
        minStockLevel: parseInt(formData.minStockLevel) || 0,
        maxStockLevel: parseInt(formData.maxStockLevel) || 0,
        isActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const updatedProductVariation = await updateProductVariation(selectedProductVariation.variationId, updateData);
      setProductVariations(prev => prev.map(variation => 
        variation.variationId === selectedProductVariation.variationId ? updatedProductVariation : variation
      ));
      
      setIsUpdateFormOpen(false);
      setSelectedProductVariation(null);
      alert('Product variation updated successfully!');
      
    } catch (err) {
      console.error('Error updating product variation:', err);
      alert('Failed to update product variation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define form fields for product variation creation/editing
  const getFormFields = (isEdit = false): FormField[] => [
    {
      name: 'versionId',
      label: 'Version ID',
      type: 'number',
      placeholder: 'Enter version ID',
      required: true,
      validation: (value: string) => {
        if (value && parseInt(value) <= 0) {
          return 'Version ID must be greater than 0';
        }
        return null;
      }
    },
    {
      name: 'variationName',
      label: 'Variation Name',
      type: 'text',
      placeholder: 'Enter variation name',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'Variation name must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'color',
      label: 'Color',
      type: 'text',
      placeholder: 'Enter color',
      required: false
    },
    {
      name: 'size',
      label: 'Size',
      type: 'text',
      placeholder: 'Enter size',
      required: false
    },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'text',
      placeholder: 'Enter capacity',
      required: false
    },
    {
      name: 'barcode',
      label: 'Barcode',
      type: 'text',
      placeholder: 'Enter barcode',
      required: false
    },
    {
      name: 'price',
      label: 'Price',
      type: 'number',
      placeholder: 'Enter price',
      required: false,
      validation: (value: string) => {
        if (value && parseFloat(value) < 0) {
          return 'Price must be greater than or equal to 0';
        }
        return null;
      }
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: 'number',
      placeholder: 'Enter quantity',
      required: false,
      validation: (value: string) => {
        if (value && parseInt(value) < 0) {
          return 'Quantity must be greater than or equal to 0';
        }
        return null;
      }
    },
    {
      name: 'minStockLevel',
      label: 'Min Stock Level',
      type: 'number',
      placeholder: 'Enter minimum stock level',
      required: false,
      validation: (value: string) => {
        if (value && parseInt(value) < 0) {
          return 'Minimum stock level must be greater than or equal to 0';
        }
        return null;
      }
    },
    {
      name: 'maxStockLevel',
      label: 'Max Stock Level',
      type: 'number',
      placeholder: 'Enter maximum stock level',
      required: false,
      validation: (value: string) => {
        if (value && parseInt(value) < 0) {
          return 'Maximum stock level must be greater than or equal to 0';
        }
        return null;
      }
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
      key: 'variationId',
      label: 'Variation ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(4, '0')}
        </span>
      )
    },
    {
      key: 'versionId',
      label: 'Version ID',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'variationName',
      label: 'Variation Name',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'color',
      label: 'Color',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value || '-'}</span>
      )
    },
    {
      key: 'size',
      label: 'Size',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value || '-'}</span>
      )
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value || '-'}</span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {value ? `LKR:${value.toLocaleString()}` : '$0'}
        </span>

        // <span className="font-medium ">
        //   LKR:{value ? value.toLocaleString('en-US', {
        //     minimumFractionDigits: 2,
        //     maximumFractionDigits: 2
        //   }) : '0.00'}
        // </span>
      )
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'minStockLevel',
      label: 'MinStockLevel',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'maxStockLevel',
      label: 'MaxStockLevel',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'isActive',
      label: 'Is Active',
      sortable: true,
      filterable: true,
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Yes' : 'No'}
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
      // {
      //   label: 'Add Spec',
      //   onClick: (productVariation: ProductVariation) => {
      //     // Navigate to product variation specs page
      //     router.push(`/productvariation/${productVariation.variationId}/specs`);
      //   },
      //   variant: 'secondary'
      // },
      {
        label: (
                <span className="flex items-center gap-2">
                  <Pencil size={16} />
                  
                </span>
              ),
        onClick: (productVariation: ProductVariation) => {
          handleEditProductVariation(productVariation);
        },
        variant: 'primary'
      },
      {
        label: (
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  
                </span>
              ),
        onClick: (productVariation: ProductVariation) => {
          if (isDeleting === productVariation.variationId) {
            return;
          }
          handleDeleteProductVariation(productVariation);
        },
        variant: 'danger'
      }
    ];
  };

  const actions = getActions();

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create product variation clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedProductVariation(null);
  };

  // Handle Back button
  const handleBackClick = () => {
    router.back();
  };

  // Handle Add New Spec button
  const handleAddNewSpecClick = () => {
    // Navigate to create new spec page
    router.push('/productvariation/new-spec');
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const productVariationsData = await fetchProductVariations();
      setProductVariations(productVariationsData);
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
            Only stockkeepers can access product variation management.
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
          <div className="max-w-full">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Product Variation Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage product variations, specifications, and inventory details
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleBackClick}
                    className="px-6 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    Back
                  </button>
                  {/* <button
                    onClick={handleAddNewSpecClick}
                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Add New Spec
                  </button> */}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table
                data={productVariations}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No product variations found. Create your first product variation to get started."
                onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                createButtonLabel="Create"
                className="border border-gray-200"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Create Product Variation Form Popup */}
      {isCreateFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseCreateForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <div className="relative bg-white rounded-lg shadow-xl">
                <button
                  onClick={handleCloseCreateForm}
                  className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <Form
                  fields={getFormFields(false)}
                  onSubmit={handleCreateProductVariation}
                  onClear={() => {}}
                  title="Create New Product Variation"
                  submitButtonLabel="Create Product Variation"
                  clearButtonLabel="Clear"
                  loading={isSubmitting}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Product Variation Form Popup */}
      {isUpdateFormOpen && selectedProductVariation && (
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
                  fields={getFormFields(true)}
                  onSubmit={handleUpdateProductVariation}
                  title="Update Product Variation"
                  
                  loading={isSubmitting}
                  initialData={{
                    versionId: selectedProductVariation.versionId.toString(),
                    variationName: selectedProductVariation.variationName,
                    color: selectedProductVariation.color,
                    size: selectedProductVariation.size,
                    capacity: selectedProductVariation.capacity,
                    barcode: selectedProductVariation.barcode,
                    price: selectedProductVariation.price.toString(),
                    quantity: selectedProductVariation.quantity.toString(),
                    minStockLevel: selectedProductVariation.minStockLevel.toString(),
                    maxStockLevel: selectedProductVariation.maxStockLevel.toString(),
                    isActive: selectedProductVariation.isActive
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
        title="Delete a Product Variation"
        message="Are you sure you want to delete this product variation?"
        warningMessage="By deleting this, automatically cancel the related fields."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === productVariationToDelete?.variationId}
        itemName={productVariationToDelete?.variationName}
      />
    </div>
  );
};

export default ProductVariationPage;