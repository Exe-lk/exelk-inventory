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
import { Supplier } from '@/types/supplier';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/services/supplierService';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { Pencil, Eye, Trash2 } from 'lucide-react';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

const SupplierPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  usePageTitle('Supplier');

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Only allow stockkeepers to access suppliers
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

  // Fetch supplier data
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const suppliersData = await fetchSuppliers();
        setSuppliers(suppliersData);
        
        console.log('Loaded suppliers:', suppliersData.length);
        
      } catch (err) {
        console.error('Error loading suppliers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load suppliers');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access supplier management.');
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

  // Handle supplier deletion
  const handleDeleteSupplier = async (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      setIsDeleting(supplierToDelete.SupplierID);
      await deleteSupplier(supplierToDelete.SupplierID);
      
      // Remove from local state
      setSuppliers(prev => prev.filter(supplier => supplier.SupplierID !== supplierToDelete.SupplierID));
      
      // Close modal and clear state
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
      
      alert('Supplier deleted successfully!');
      console.log('Supplier deleted successfully');
    } catch (err) {
      console.error('Error deleting supplier:', err);
      alert('Failed to delete supplier. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setIsDeleteModalOpen(false);
    setSupplierToDelete(null);
  };

  // Handle edit supplier
  const handleEditSupplier = (supplier: Supplier) => {
    console.log('Edit supplier:', supplier);
    setSelectedSupplier(supplier);
    setIsUpdateFormOpen(true);
  };

  // Handle create supplier form submission
  const handleCreateSupplier = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      console.log('Creating supplier with data:', formData);
      
      const supplierData = {
        SupplierName: formData.supplierName,
        ContactPerson: formData.contactPerson,
        Email: formData.email,
        Phone: formData.phone,
        Address: formData.address || '',
        City: formData.city || '',
        Country: formData.country || '',
        IsActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const newSupplier = await createSupplier(supplierData);
      setSuppliers(prev => [...prev, newSupplier]);
      
      setIsCreateFormOpen(false);
      alert('Supplier created successfully!');
      
    } catch (err) {
      console.error('Error creating supplier:', err);
      alert('Failed to create supplier. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update supplier form submission
  const handleUpdateSupplier = async (formData: Record<string, any>) => {
    if (!selectedSupplier) return;
    
    try {
      setIsSubmitting(true);
      
      console.log('Updating supplier with data:', formData);
      
      const updateData = {
        SupplierName: formData.supplierName,
        ContactPerson: formData.contactPerson,
        Email: formData.email,
        Phone: formData.phone,
        Address: formData.address,
        City: formData.city,
        Country: formData.country,
        IsActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const updatedSupplier = await updateSupplier(selectedSupplier.SupplierID, updateData);
      setSuppliers(prev => prev.map(supplier => 
        supplier.SupplierID === selectedSupplier.SupplierID ? updatedSupplier : supplier
      ));
      
      setIsUpdateFormOpen(false);
      setSelectedSupplier(null);
      alert('Supplier updated successfully!');
      
    } catch (err) {
      console.error('Error updating supplier:', err);
      alert('Failed to update supplier. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  };

  // Define form fields for supplier creation/editing
  const getFormFields = (isEdit = false): FormField[] => [
    {
      name: 'supplierName',
      label: 'Supplier Name',
      type: 'text',
      placeholder: 'Enter supplier name',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'Supplier name must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'contactPerson',
      label: 'Contact Person',
      type: 'text',
      placeholder: 'Enter contact person name',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'Contact person name must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter email address',
      required: true,
      validation: (value: string) => {
        if (value && !validateEmail(value)) {
          return 'Please enter a valid email address';
        }
        return null;
      }
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
      placeholder: 'Enter phone number',
      required: true,
      validation: (value: string) => {
        if (value && !validatePhone(value)) {
          return 'Please enter a valid phone number';
        }
        return null;
      }
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Enter address (optional)',
      required: false,
      rows: 3
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'Enter city (optional)',
      required: false
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
      key: 'SupplierID',
      label: 'ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {String(value).padStart(3, '0')}
        </span>
      )
    },
    {
      key: 'SupplierName',
      label: 'Supplier',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{value}</span>
      )
    },
    {
      key: 'ContactPerson',
      label: 'Contact Person',
      sortable: true,
      filterable: false,
      render: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">{value}</span>
      )
    },
    {
      key: 'Email',
      label: 'Email',
      sortable: true,
      filterable: false,
      render: (value: string) => (
        <span className="text-blue-600 dark:text-blue-400">{value}</span>
      )
    },
    {
      key: 'Phone',
      label: 'Phone',
      sortable: true,
      filterable: false,
      render: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">{value}</span>
      )
    },
    {
      key: 'City',
      label: 'City',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'Country',
      label: 'Country',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">
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
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
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
        <span className="text-gray-600 dark:text-gray-400">
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
        onClick: (supplier: Supplier) => {
          handleEditSupplier(supplier);
        },
        variant: 'primary'
      },
      {
        label: (
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  
                </span>
              ),
        onClick: (supplier: Supplier) => {
          // Check if currently being deleted
          if (isDeleting === supplier.SupplierID) {
            return; // Prevent multiple delete attempts
          }
          handleDeleteSupplier(supplier);
        },
        variant: 'danger'
      }
    ];
  };

  const actions = getActions();

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create supplier clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedSupplier(null);
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const suppliersData = await fetchSuppliers();
      setSuppliers(suppliersData);
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
            Only stockkeepers can access supplier management.
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
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Supplier Management</h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage suppliers and their contact information
                  </p>
                  
                </div>
                
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
              <Table
                data={suppliers}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No suppliers found. Create your first supplier to get started."
                onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                createButtonLabel="Create Supplier"
                className="border border-gray-200 dark:border-slate-700"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Create Supplier Form Popup */}
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
                  fields={getFormFields(false)}
                  onSubmit={handleCreateSupplier}
                  onClear={() => {}}
                  title="Create New Supplier"
                  submitButtonLabel="Create Supplier"
                  clearButtonLabel="Clear"
                  loading={isSubmitting}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Supplier Form Popup */}
      {isUpdateFormOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseUpdateForm}></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                {/* Close button */}
                <button
                  onClick={handleCloseUpdateForm}
                  className="absolute right-4 top-4 z-10 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Update Form */}
                <UpdateForm
                  fields={getFormFields(true)}
                  onSubmit={handleUpdateSupplier}
                  title="Update Supplier"
                  //updateButtonLabel="Update Supplier"
                  loading={isSubmitting}
                  initialData={{
                    supplierName: selectedSupplier.SupplierName,
                    contactPerson: selectedSupplier.ContactPerson,
                    email: selectedSupplier.Email,
                    phone: selectedSupplier.Phone,
                    address: selectedSupplier.Address || '',
                    city: selectedSupplier.City || '',
                    country: selectedSupplier.Country || '',
                    isActive: selectedSupplier.IsActive
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
        title="Delete a Supplier"
        message="Are you sure you want to delete this supplier?"
        warningMessage="By deleting this, automatically cancel the related fields."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === supplierToDelete?.SupplierID}
        itemName={supplierToDelete?.SupplierName}
      />
    </div>
  );
};

export default SupplierPage;