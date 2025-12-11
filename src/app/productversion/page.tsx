// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Table, { TableColumn, ActionButton } from '@/components/Table/table';
// import SidebarWrapper from '@/components/Common/SidebarWraper';
// import Navbar from '@/components/Common/navbar';
// import Login from '@/components/login/login';
// import Form, { FormField } from '@/components/form-popup/create';
// import UpdateForm from '@/components/form-popup/update';
// import DeleteConfirmation from '@/components/form-popup/delete';
// import { Employee, hasAdminAccess, isStockKeeper } from '@/types/user';
// import { ProductVersion } from '@/types/productversion';
// import { fetchProductVersions, createProductVersion, updateProductVersion, deleteProductVersion } from '@/lib/services/productversionService';
// import { getCurrentUser, logoutUser } from '@/lib/auth';

// const ProductVersionPage: React.FC = () => {
//   const router = useRouter();
  
//   // Auth states
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
//   const [isAuthLoading, setIsAuthLoading] = useState(true);
  
//   // Sidebar states
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
//   // Data states
//   const [productVersions, setProductVersions] = useState<ProductVersion[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
//   // Form popup states
//   const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
//   const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
//   const [selectedProductVersion, setSelectedProductVersion] = useState<ProductVersion | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Delete confirmation states
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [productVersionToDelete, setProductVersionToDelete] = useState<ProductVersion | null>(null);

//   // Check authentication and authorization
//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const user = await getCurrentUser();
//         if (user) {
//           // Only allow stockkeepers to access product versions
//           if (!isStockKeeper(user.RoleID)) {
//             router.push('/home');
//             return;
//           }
//           setCurrentUser(user);
//           setIsLoggedIn(true);
//         }
//       } catch (error) {
//         console.error('Auth check failed:', error);
//       } finally {
//         setIsAuthLoading(false);
//       }
//     };

//     checkAuth();
//   }, [router]);

//   // Fetch product version data
//   useEffect(() => {
//     if (!isLoggedIn) return;

//     const loadData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         const productVersionsData = await fetchProductVersions();
//         setProductVersions(productVersionsData);
        
//         console.log('Loaded product versions:', productVersionsData.length);
        
//       } catch (err) {
//         console.error('Error loading product versions:', err);
//         setError(err instanceof Error ? err.message : 'Failed to load product versions');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [isLoggedIn]);

//   // Auth handlers
//   const handleLogin = (user: Omit<Employee, 'Password'>) => {
//     if (!isStockKeeper(user.RoleID)) {
//       alert('Access denied. Only stockkeepers can access product version management.');
//       return;
//     }
//     setCurrentUser(user);
//     setIsLoggedIn(true);
//   };

//   const handleLogout = async () => {
//     try {
//       await logoutUser();
//       setIsLoggedIn(false);
//       setCurrentUser(null);
//       router.push('/');
//     } catch (error) {
//       console.error('Logout failed:', error);
//     }
//   };

//   // Sidebar handlers
//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   const closeMobileSidebar = () => {
//     setIsSidebarOpen(false);
//   };

//   const handleSidebarExpandChange = (isExpanded: boolean) => {
//     setIsSidebarExpanded(isExpanded);
//   };

//   // Handle product version deletion
//   const handleDeleteProductVersion = async (productVersion: ProductVersion) => {
//     // Set product version to delete and open modal
//     setProductVersionToDelete(productVersion);
//     setIsDeleteModalOpen(true);
//   };

//   // Handle the actual deletion after confirmation
//   const handleConfirmDelete = async () => {
//     if (!productVersionToDelete) return;

//     try {
//       setIsDeleting(productVersionToDelete.versionId);
//       await deleteProductVersion(productVersionToDelete.versionId);
      
//       // Remove from local state
//       setProductVersions(prev => prev.filter(version => version.versionId !== productVersionToDelete.versionId));
      
//       // Close modal and clear state
//       setIsDeleteModalOpen(false);
//       setProductVersionToDelete(null);
      
//       alert('Product version deleted successfully!');
//       console.log('Product version deleted successfully');
//     } catch (err) {
//       console.error('Error deleting product version:', err);
//       alert('Failed to delete product version. Please try again.');
//     } finally {
//       setIsDeleting(null);
//     }
//   };

//   // Handle modal close
//   const handleCloseDeleteModal = () => {
//     if (isDeleting) return; // Prevent closing while deleting
//     setIsDeleteModalOpen(false);
//     setProductVersionToDelete(null);
//   };

//   // Handle edit product version
//   const handleEditProductVersion = (productVersion: ProductVersion) => {
//     console.log('Edit product version:', productVersion);
//     setSelectedProductVersion(productVersion);
//     setIsUpdateFormOpen(true);
//   };

//   // Handle create product version form submission
//   const handleCreateProductVersion = async (formData: Record<string, any>) => {
//     try {
//       setIsSubmitting(true);
      
//       console.log('Creating product version with data:', formData);
      
//       const productVersionData = {
//         productId: parseInt(formData.productId),
//         versionNumber: formData.versionNumber,
//         releaseDate: formData.releaseDate,
//         isActive: formData.isActive !== undefined ? formData.isActive : true
//       };
      
//       const newProductVersion = await createProductVersion(productVersionData);
//       setProductVersions(prev => [...prev, newProductVersion]);
      
//       setIsCreateFormOpen(false);
//       alert('Product version created successfully!');
      
//     } catch (err) {
//       console.error('Error creating product version:', err);
//       alert('Failed to create product version. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Handle update product version form submission
//   const handleUpdateProductVersion = async (formData: Record<string, any>) => {
//     if (!selectedProductVersion) return;
    
//     try {
//       setIsSubmitting(true);
      
//       console.log('Updating product version with data:', formData);
      
//       const updateData = {
//         productId: parseInt(formData.productId),
//         versionNumber: formData.versionNumber,
//         releaseDate: formData.releaseDate,
//         isActive: formData.isActive !== undefined ? formData.isActive : true
//       };
      
//       const updatedProductVersion = await updateProductVersion(selectedProductVersion.versionId, updateData);
//       setProductVersions(prev => prev.map(version => 
//         version.versionId === selectedProductVersion.versionId ? updatedProductVersion : version
//       ));
      
//       setIsUpdateFormOpen(false);
//       setSelectedProductVersion(null);
//       alert('Product version updated successfully!');
      
//     } catch (err) {
//       console.error('Error updating product version:', err);
//       alert('Failed to update product version. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Define form fields for product version creation/editing
//   const getFormFields = (isEdit = false): FormField[] => [
//     {
//       name: 'productId',
//       label: 'Product ID',
//       type: 'number',
//       placeholder: 'Enter product ID',
//       required: true,
//       validation: (value: string) => {
//         if (value && parseInt(value) <= 0) {
//           return 'Product ID must be greater than 0';
//         }
//         return null;
//       }
//     },
//     {
//       name: 'versionNumber',
//       label: 'Version Number',
//       type: 'text',
//       placeholder: 'Enter version number (e.g., 1.0, 2.1)',
//       required: true,
//       validation: (value: string) => {
//         if (value && value.length < 1) {
//           return 'Version number is required';
//         }
//         return null;
//       }
//     },
//     {
//       name: 'releaseDate',
//       label: 'Release Date',
//       type: 'date',
//       placeholder: 'Select release date',
//       required: true
//     },
//     {
//       name: 'isActive',
//       label: 'Active Status',
//       type: 'checkbox',
//       required: false
//     }
//   ];

//   // Define table columns
//   const columns: TableColumn[] = [
//     {
//       key: 'versionId',
//       label: 'Version ID',
//       sortable: true,
//       render: (value: number) => (
//         <span className="font-medium text-gray-900">
//           {String(value).padStart(3, '0')}
//         </span>
//       )
//     },
//     {
//       key: 'productId',
//       label: 'Product ID',
//       sortable: true,
//       filterable: true,
//       render: (value: number) => (
//         <span className="font-medium text-gray-900">{value}</span>
//       )
//     },
//     {
//       key: 'versionNumber',
//       label: 'Version Number',
//       sortable: true,
//       filterable: true,
//       render: (value: string) => (
//         <span className="font-medium text-gray-900">{value}</span>
//       )
//     },
//     {
//       key: 'releaseDate',
//       label: 'Release Date',
//       sortable: true,
//       render: (value: string) => (
//         <span className="text-gray-600">
//           {value ? new Date(value).toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric'
//           }) : 'N/A'}
//         </span>
//       )
//     },
//     {
//       key: 'isActive',
//       label: 'Status',
//       sortable: true,
//       filterable: true,
//       render: (value: boolean) => (
//         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//           value 
//             ? 'bg-green-100 text-green-800' 
//             : 'bg-red-100 text-red-800'
//         }`}>
//           {value ? 'Yes' : 'No'}
//         </span>
//       )
//     }
//   ];

//   // Define action buttons for stockkeepers only
//   const getActions = (): ActionButton[] => {
//     if (!isStockKeeper(currentUser?.RoleID || 0)) {
//       return []; // No actions for non-stockkeepers
//     }
    
//     return [
//       {
//         label: 'Update',
//         onClick: (productVersion: ProductVersion) => {
//           handleEditProductVersion(productVersion);
//         },
//         variant: 'primary'
//       },
//       {
//         label: 'Delete',
//         onClick: (productVersion: ProductVersion) => {
//           // Check if currently being deleted
//           if (isDeleting === productVersion.versionId) {
//             return; // Prevent multiple delete attempts
//           }
//           handleDeleteProductVersion(productVersion);
//         },
//         variant: 'danger'
//       }
//     ];
//   };

//   const actions = getActions();

//   // Form handlers
//   const handleCreateClick = () => {
//     console.log('Create product version clicked');
//     setIsCreateFormOpen(true);
//   };

//   const handleCloseCreateForm = () => {
//     setIsCreateFormOpen(false);
//   };

//   const handleCloseUpdateForm = () => {
//     setIsUpdateFormOpen(false);
//     setSelectedProductVersion(null);
//   };

//   // Refresh data
//   const refreshData = async () => {
//     try {
//       setLoading(true);
//       const productVersionsData = await fetchProductVersions();
//       setProductVersions(productVersionsData);
//       setError(null);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to refresh data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Show loading spinner during auth check
//   if (isAuthLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="flex flex-col items-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
//           <div className="text-lg text-gray-600">Loading...</div>
//         </div>
//       </div>
//     );
//   }

//   // Show login if not authenticated
//   if (!isLoggedIn) {
//     return <Login onLogin={handleLogin} />;
//   }

//   // Show access denied for unauthorized users
//   if (!isStockKeeper(currentUser?.RoleID || 0)) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
//           <div className="text-red-500 text-4xl mb-4">🚫</div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
//           <p className="text-gray-600 mb-6">
//             Only stockkeepers can access product version management.
//           </p>
//           <button
//             onClick={() => router.push('/home')}
//             className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             Go to Dashboard
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-100">
//         <Navbar currentUser={currentUser} onMenuClick={toggleSidebar} />
//         <SidebarWrapper
//           currentUser={currentUser}
//           onLogout={handleLogout} 
//           isMobileOpen={isSidebarOpen}
//           onMobileClose={closeMobileSidebar}
//           onExpandedChange={handleSidebarExpandChange}
//         />
//         <div className={`pt-[70px] transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'}`}>
//           <main className="overflow-y-auto bg-gray-50 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
//             <div className="flex items-center justify-center min-h-[60vh]">
//               <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
//                 <div className="text-center">
//                   <div className="text-red-500 text-xl mb-4">⚠️</div>
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
//                   <p className="text-gray-500 mb-4">{error}</p>
//                   <div className="space-x-4">
//                     <button onClick={refreshData} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
//                       Retry
//                     </button>
//                     <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
//                       Reload Page
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* Navbar */}
//       <Navbar currentUser={currentUser} onMenuClick={toggleSidebar} />

//       {/* Role-based Sidebar */}
//       <SidebarWrapper
//         currentUser={currentUser}
//         onLogout={handleLogout} 
//         isMobileOpen={isSidebarOpen}
//         onMobileClose={closeMobileSidebar}
//         onExpandedChange={handleSidebarExpandChange}
//       />

//       {/* Main Content */}
//       <div className={`pt-[70px] transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'}`}>
//         <main className="overflow-y-auto bg-gray-50 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
//           <div className="max-w-full">
//             <div className="mb-8">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h1 className="text-3xl font-bold text-gray-900">Product Version Management</h1>
//                   <p className="mt-2 text-gray-600">
//                     Manage product versions and their release information
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white rounded-lg shadow">
//               <Table
//                 data={productVersions}
//                 columns={columns}
//                 actions={actions}
//                 itemsPerPage={10}
//                 searchable={true}
//                 filterable={true}
//                 loading={loading}
//                 emptyMessage="No product versions found. Create your first product version to get started."
//                 onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
//                 createButtonLabel="Create"
//                 className="border border-gray-200"
//               />
//             </div>
//           </div>
//         </main>
//       </div>

//       {/* Create Product Version Form Popup */}
//       {isCreateFormOpen && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           {/* Backdrop */}
//           <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseCreateForm}></div>
          
//           {/* Modal */}
//           <div className="flex min-h-full items-center justify-center p-4">
//             <div className="relative w-full max-w-2xl">
//               <div className="relative bg-white rounded-lg shadow-xl">
//                 {/* Close button */}
//                 <button
//                   onClick={handleCloseCreateForm}
//                   className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
//                 >
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>

//                 {/* Form */}
//                 <Form
//                   fields={getFormFields(false)}
//                   onSubmit={handleCreateProductVersion}
//                   onClear={() => {}}
//                   title="Create New Product Version"
//                   submitButtonLabel="Create Product Version"
//                   clearButtonLabel="Clear"
//                   loading={isSubmitting}
//                   className="border-0 shadow-none"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Update Product Version Form Popup */}
//       {isUpdateFormOpen && selectedProductVersion && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           {/* Backdrop */}
//           <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseUpdateForm}></div>
          
//           {/* Modal */}
//           <div className="flex min-h-full items-center justify-center p-4">
//             <div className="relative w-full max-w-2xl">
//               <div className="relative bg-white rounded-lg shadow-xl">
//                 {/* Close button */}
//                 <button
//                   onClick={handleCloseUpdateForm}
//                   className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
//                 >
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>

//                 {/* Update Form */}
//                 <UpdateForm
//                   fields={getFormFields(true)}
//                   onSubmit={handleUpdateProductVersion}
//                   title="Update Product Version"
                  
//                   loading={isSubmitting}
//                   initialData={{
//                     productId: selectedProductVersion.productId.toString(),
//                     versionNumber: selectedProductVersion.versionNumber,
//                     releaseDate: selectedProductVersion.releaseDate,
//                     isActive: selectedProductVersion.isActive
//                   }}
//                   className="border-0 shadow-none"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       <DeleteConfirmation
//         isOpen={isDeleteModalOpen}
//         onClose={handleCloseDeleteModal}
//         onConfirm={handleConfirmDelete}
//         title="Delete Product Version"
//         message="Are you sure you want to delete this product version?"
//         warningMessage="This action cannot be undone and may affect related records."
//         confirmButtonText="Yes, Delete"
//         cancelButtonText="No, Cancel"
//         loading={isDeleting === productVersionToDelete?.versionId}
//         itemName={productVersionToDelete?.versionNumber}
//       />
//     </div>
//   );
// };

// export default ProductVersionPage;





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
import { ProductVersion } from '@/types/productversion';
import { fetchProductVersions, createProductVersion, updateProductVersion, deleteProductVersion } from '@/lib/services/productversionService';
import { getCurrentUser, logoutUser } from '@/lib/auth';

const ProductVersionPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [productVersions, setProductVersions] = useState<ProductVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedProductVersion, setSelectedProductVersion] = useState<ProductVersion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productVersionToDelete, setProductVersionToDelete] = useState<ProductVersion | null>(null);

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Only allow stockkeepers to access product versions
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

  // Fetch product version data
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productVersionsData = await fetchProductVersions();
        setProductVersions(productVersionsData);
        
        console.log('Loaded product versions:', productVersionsData.length);
        
      } catch (err) {
        console.error('Error loading product versions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product versions');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access product version management.');
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

  // Navigation handlers
  const handleBackToProducts = () => {
    router.push('/product');
  };

  const handleViewProductVariation = () => {
    router.push('/productvariation');
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

  // Handle product version deletion
  const handleDeleteProductVersion = async (productVersion: ProductVersion) => {
    // Set product version to delete and open modal
    setProductVersionToDelete(productVersion);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!productVersionToDelete) return;

    try {
      setIsDeleting(productVersionToDelete.versionId);
      await deleteProductVersion(productVersionToDelete.versionId);
      
      // Remove from local state
      setProductVersions(prev => prev.filter(version => version.versionId !== productVersionToDelete.versionId));
      
      // Close modal and clear state
      setIsDeleteModalOpen(false);
      setProductVersionToDelete(null);
      
      alert('Product version deleted successfully!');
      console.log('Product version deleted successfully');
    } catch (err) {
      console.error('Error deleting product version:', err);
      alert('Failed to delete product version. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setIsDeleteModalOpen(false);
    setProductVersionToDelete(null);
  };

  // Handle edit product version
  const handleEditProductVersion = (productVersion: ProductVersion) => {
    console.log('Edit product version:', productVersion);
    setSelectedProductVersion(productVersion);
    setIsUpdateFormOpen(true);
  };

  // Handle create product version form submission
  const handleCreateProductVersion = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      console.log('Creating product version with data:', formData);
      
      const productVersionData = {
        productId: parseInt(formData.productId),
        versionNumber: formData.versionNumber,
        releaseDate: formData.releaseDate,
        isActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const newProductVersion = await createProductVersion(productVersionData);
      setProductVersions(prev => [...prev, newProductVersion]);
      
      setIsCreateFormOpen(false);
      alert('Product version created successfully!');
      
    } catch (err) {
      console.error('Error creating product version:', err);
      alert('Failed to create product version. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update product version form submission
  const handleUpdateProductVersion = async (formData: Record<string, any>) => {
    if (!selectedProductVersion) return;
    
    try {
      setIsSubmitting(true);
      
      console.log('Updating product version with data:', formData);
      
      const updateData = {
        productId: parseInt(formData.productId),
        versionNumber: formData.versionNumber,
        releaseDate: formData.releaseDate,
        isActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const updatedProductVersion = await updateProductVersion(selectedProductVersion.versionId, updateData);
      setProductVersions(prev => prev.map(version => 
        version.versionId === selectedProductVersion.versionId ? updatedProductVersion : version
      ));
      
      setIsUpdateFormOpen(false);
      setSelectedProductVersion(null);
      alert('Product version updated successfully!');
      
    } catch (err) {
      console.error('Error updating product version:', err);
      alert('Failed to update product version. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define form fields for product version creation/editing
  const getFormFields = (isEdit = false): FormField[] => [
    {
      name: 'productId',
      label: 'Product ID',
      type: 'number',
      placeholder: 'Enter product ID',
      required: true,
      validation: (value: string) => {
        if (value && parseInt(value) <= 0) {
          return 'Product ID must be greater than 0';
        }
        return null;
      }
    },
    {
      name: 'versionNumber',
      label: 'Version Number',
      type: 'text',
      placeholder: 'Enter version number (e.g., 1.0, 2.1)',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 1) {
          return 'Version number is required';
        }
        return null;
      }
    },
    {
      name: 'releaseDate',
      label: 'Release Date',
      type: 'date',
      placeholder: 'Select release date',
      required: true
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
      key: 'versionId',
      label: 'Version ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(3, '0')}
        </span>
      )
    },
    {
      key: 'productId',
      label: 'Product ID',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'versionNumber',
      label: 'Version Number',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'releaseDate',
      label: 'Release Date',
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
      key: 'isActive',
      label: 'Status',
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
      return []; // No actions for non-stockkeepers
    }
    
    return [
      {
        label: 'Update',
        onClick: (productVersion: ProductVersion) => {
          handleEditProductVersion(productVersion);
        },
        variant: 'primary'
      },
      {
        label: 'Delete',
        onClick: (productVersion: ProductVersion) => {
          // Check if currently being deleted
          if (isDeleting === productVersion.versionId) {
            return; // Prevent multiple delete attempts
          }
          handleDeleteProductVersion(productVersion);
        },
        variant: 'danger'
      }
    ];
  };

  const actions = getActions();

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create product version clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedProductVersion(null);
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const productVersionsData = await fetchProductVersions();
      setProductVersions(productVersionsData);
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
            Only stockkeepers can access product version management.
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
                  <h1 className="text-3xl font-bold text-gray-900">Product Version Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage product versions and their release information
                  </p>
                </div>
                
                {/* Navigation Buttons - Top Right */}
                <div className="flex items-center space-x-3">
                  {/* Back Button */}
                  <button
                    onClick={handleBackToProducts}
                    className="px-6 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    
                    Back 
                  </button>

                  {/* View Product Variation Button */}
                  <button
                    onClick={handleViewProductVariation}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-Blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
                  >
                    
                    View Product Variation
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table
                data={productVersions}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No product versions found. Create your first product version to get started."
                onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                createButtonLabel="Create"
                className="border border-gray-200"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Create Product Version Form Popup */}
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
                  onSubmit={handleCreateProductVersion}
                  onClear={() => {}}
                  title="Create New Product Version"
                  submitButtonLabel="Create Product Version"
                  clearButtonLabel="Clear"
                  loading={isSubmitting}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Product Version Form Popup */}
      {isUpdateFormOpen && selectedProductVersion && (
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
                  onSubmit={handleUpdateProductVersion}
                  title="Update Product Version"
                  loading={isSubmitting}
                  initialData={{
                    productId: selectedProductVersion.productId.toString(),
                    versionNumber: selectedProductVersion.versionNumber,
                    releaseDate: selectedProductVersion.releaseDate,
                    isActive: selectedProductVersion.isActive
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
        title="Delete Product Version"
        message="Are you sure you want to delete this product version?"
        warningMessage="This action cannot be undone and may affect related records."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === productVersionToDelete?.versionId}
        itemName={productVersionToDelete?.versionNumber}
      />
    </div>
  );
};

export default ProductVersionPage;