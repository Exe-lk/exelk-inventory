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
import { Model } from '@/types/model';
import { Brand } from '@/types/brand';
import { fetchModels, createModel, updateModel, deleteModel, fetchBrands } from '@/lib/services/modelService';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { Pencil, Eye, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

const ModelPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);
  usePageTitle('Model');

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Only allow stockkeepers to access models
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

  // Fetch model data
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both models and brands
        const [modelsData, brandsData] = await Promise.all([
          fetchModels(),
          fetchBrands()
        ]);
        
        setModels(modelsData);
        setBrands(brandsData);
        
        console.log('Loaded models:', modelsData.length);
        console.log('Loaded brands:', brandsData.length);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access model management.');
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

  // Helper function to get brand name
  const getBrandName = (brandID: number): string => {
    const brand = brands.find(b => b.BrandID === brandID);
    return brand ? brand.BrandName : `Brand ${brandID}`;
  };

  // Handle model deletion - Updated to use modal
  const handleDeleteModel = async (model: Model) => {
    // Set model to delete and open modal
    setModelToDelete(model);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!modelToDelete) return;

    try {
      setIsDeleting(modelToDelete.ModelID);
      await deleteModel(modelToDelete.ModelID);
      
      // Remove from local state
      setModels(prev => prev.filter(model => model.ModelID !== modelToDelete.ModelID));
      
      // Close modal and clear state
      setIsDeleteModalOpen(false);
      setModelToDelete(null);
      
      alert('Model deleted successfully!');
      console.log('Model deleted successfully');
    } catch (err) {
      console.error('Error deleting model:', err);
      alert('Failed to delete model. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setIsDeleteModalOpen(false);
    setModelToDelete(null);
  };

  // Handle edit model
  const handleEditModel = (model: Model) => {
    console.log('Edit model:', model);
    setSelectedModel(model);
    setIsUpdateFormOpen(true);
  };

  // Handle create model form submission
  const handleCreateModel = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      console.log('Creating model with data:', formData);
      
      const modelData = {
        ModelName: formData.modelName,
        Description: formData.description,
        BrandID: parseInt(formData.brandId),
        IsActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const newModel = await createModel(modelData);
      setModels(prev => [...prev, newModel]);
      
      setIsCreateFormOpen(false);
      alert('Model created successfully!');
      
    } catch (err) {
      console.error('Error creating model:', err);
      alert('Failed to create model. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update model form submission
  const handleUpdateModel = async (formData: Record<string, any>) => {
    if (!selectedModel) return;
    
    try {
      setIsSubmitting(true);
      
      console.log('Updating model with data:', formData);
      
      const updateData = {
        ModelName: formData.modelName,
        Description: formData.description,
        BrandID: parseInt(formData.brandId),
        IsActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const updatedModel = await updateModel(selectedModel.ModelID, updateData);
      setModels(prev => prev.map(model => 
        model.ModelID === selectedModel.ModelID ? updatedModel : model
      ));
      
      setIsUpdateFormOpen(false);
      setSelectedModel(null);
      alert('Model updated successfully!');
      
    } catch (err) {
      console.error('Error updating model:', err);
      alert('Failed to update model. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define form fields for model creation/editing
  const getFormFields = (isEdit = false): FormField[] => [
    {
      name: 'modelName',
      label: 'Model Name',
      type: 'text',
      placeholder: 'Enter model name',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'Model name must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter model description',
      required: true,
      rows: 3
    },
    {
      name: 'brandId',
      label: 'Brand',
      type: 'select',
      placeholder: 'Select a brand',
      required: true,
      options: brands
        .filter(brand => brand.IsActive)
        .map(brand => ({
          label: brand.BrandName,
          value: brand.BrandID
        }))
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
      key: 'ModelID',
      label: 'ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(3, '0')}
        </span>
      )
    },
    {
      key: 'ModelName',
      label: 'Model',
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
      render: (value: string) => (
        <span className="text-gray-600">
          {value.length > 50 ? `${value.substring(0, 50)}...` : value}
        </span>
      )
    },
    {
      key: 'BrandID',
      label: 'Brand',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="text-gray-600">
          {getBrandName(value)}
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
        onClick: (model: Model) => {
          handleEditModel(model);
        },
        variant: 'primary'
      },
      {
        label: (
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  
                </span>
              ),
        onClick: (model: Model) => {
          // Check if currently being deleted
          if (isDeleting === model.ModelID) {
            return; // Prevent multiple delete attempts
          }
          handleDeleteModel(model);
        },
        variant: 'danger'
      }
    ];
  };

  const actions = getActions();

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create model clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedModel(null);
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const [modelsData, brandsData] = await Promise.all([
        fetchModels(),
        fetchBrands()
      ]);
      setModels(modelsData);
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
            Only stockkeepers can access model management.
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
                  <h1 className="text-3xl font-bold text-gray-900">Model Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage product models and their brand associations
                  </p>
                  
                </div>
                
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table
                data={models}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No models found. Create your first model to get started."
                onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                createButtonLabel="Create Model"
                className="border border-gray-200"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Create Model Form Popup */}
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
                  onSubmit={handleCreateModel}
                  onClear={() => {}}
                  title="Create New Model"
                  submitButtonLabel="Create Model"
                  clearButtonLabel="Clear"
                  loading={isSubmitting}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Model Form Popup */}
      {isUpdateFormOpen && selectedModel && (
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
                  onSubmit={handleUpdateModel}
                  title="Update Model"
                  //updateButtonLabel="Update Model"
                  loading={isSubmitting}
                  initialData={{
                    modelName: selectedModel.ModelName,
                    description: selectedModel.Description,
                    brandId: selectedModel.BrandID,
                    isActive: selectedModel.IsActive
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
        title="Delete a Model"
        message="Are you sure you want to delete that Model ?"
        warningMessage="By Deleting this, automatically cancel the related fields."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === modelToDelete?.ModelID}
        itemName={modelToDelete?.ModelName}
      />
    </div>
  );
};

export default ModelPage;