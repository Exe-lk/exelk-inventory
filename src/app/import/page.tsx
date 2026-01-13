
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
import { ImportFile } from '@/types/importfile';
import { 
  fetchImportFiles, 
  updateImportFile, 
  deleteImportFile, 
  fetchImportFileById,
  uploadAndCreateImportFile
} from '@/lib/services/importService';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { Pencil, Eye, Trash2, Upload, Download, FileText } from 'lucide-react';
import { usePageTitle } from '@/lib/hooks/usePageTitle';

const ImportPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [importFiles, setImportFiles] = useState<ImportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<ImportFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [importFileToDelete, setImportFileToDelete] = useState<ImportFile | null>(null);

  usePageTitle('Import');

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Only allow stockkeepers to access imports
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

  // Fetch import files data
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const importData = await fetchImportFiles();
        setImportFiles(importData.items);
        
        console.log('Loaded import files:', importData.items.length);
        
      } catch (err) {
        console.error('Error loading import files:', err);
        setError(err instanceof Error ? err.message : 'Failed to load import files');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access import management.');
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

  // Handle import file deletion
  const handleDeleteImportFile = async (importFile: ImportFile) => {
    setImportFileToDelete(importFile);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!importFileToDelete) return;

    try {
      setIsDeleting(importFileToDelete.ImportID);
      await deleteImportFile(importFileToDelete.ImportID);
      
      // Remove from local state
      setImportFiles(prev => prev.filter(file => file.ImportID !== importFileToDelete.ImportID));
      
      // Close modal and clear state
      setIsDeleteModalOpen(false);
      setImportFileToDelete(null);
      
      alert('Import file deleted successfully!');
      console.log('Import file deleted successfully');
    } catch (err) {
      console.error('Error deleting import file:', err);
      alert('Failed to delete import file. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setIsDeleteModalOpen(false);
    setImportFileToDelete(null);
  };

  // Handle edit import file
  const handleEditImportFile = (importFile: ImportFile) => {
    console.log('Edit import file:', importFile);
    setSelectedImportFile(importFile);
    setIsUpdateFormOpen(true);
  };

  // Handle view import file details
  const handleViewImportFile = async (importFile: ImportFile) => {
    try {
      const details = await fetchImportFileById(importFile.ImportID);
      console.log('Import file details:', details);
      alert(`Import file details:\nFile: ${details.fileName}\nStatus: ${details.status}\nRecords: ${details.totalRecords || 'N/A'}`);
    } catch (error) {
      console.error('Error fetching import file details:', error);
      alert('Failed to fetch import file details.');
    }
  };

  // Handle create import file form submission
  const handleCreateImportFile = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      console.log('Creating import file with data:', formData);
      
      const file = formData.file as File;
      const remarks = formData.remarks as string;
      
      if (!file) {
        alert('Please select a file to upload');
        return;
      }

      if (!(file instanceof File)) {
        alert('Invalid file selected');
        return;
      }

      // Additional file validation
      const allowedExtensions = ['xlsx', 'xls', 'csv'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        alert('Please select a valid Excel or CSV file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      const newImportFile = await uploadAndCreateImportFile(file, remarks || '', currentUser?.EmployeeID);
      setImportFiles(prev => [newImportFile, ...prev]);
      
      setIsCreateFormOpen(false);
      alert('Import file created successfully!');
      
    } catch (err) {
      console.error('Error creating import file:', err);
      alert(`Failed to create import file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update import file form submission
  const handleUpdateImportFile = async (formData: Record<string, any>) => {
    if (!selectedImportFile) return;
    
    try {
      setIsSubmitting(true);
      
      console.log('Updating import file with data:', formData);
      
      const updateData = {
        FileName: formData.fileName,
        FileType: formData.fileType,
        Status: formData.status,
        ErrorCount: formData.errorCount,
        Remarks: formData.remarks,
        FilePath: formData.filePath
      };
      
      const updatedImportFile = await updateImportFile(selectedImportFile.ImportID, updateData);
      setImportFiles(prev => prev.map(file => 
        file.ImportID === selectedImportFile.ImportID ? updatedImportFile : file
      ));
      
      setIsUpdateFormOpen(false);
      setSelectedImportFile(null);
      alert('Import file updated successfully!');
      
    } catch (err) {
      console.error('Error updating import file:', err);
      alert('Failed to update import file. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create form fields (only file and remarks)
  const getCreateFormFields = (): FormField[] => [
    {
      name: 'file',
      label: 'Select File',
      type: 'text',// change this type to 'file'
      placeholder: 'Choose a file to upload',
      required: true,
      accept: '.csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/csv',
      validation: (value: File | null | undefined) => {
        console.log('File validation - value:', value, 'type:', typeof value);
        
        // Check if value exists and is a File object
        if (!value) {
          return 'Please select a file';
        }
        
        if (!(value instanceof File)) {
          return 'Invalid file selected';
        }
        
        // Check if file has a name
        if (!value.name) {
          return 'File name is required';
        }
        
        const allowedExtensions = ['xlsx', 'xls', 'csv'];
        const fileName = value.name.toLowerCase();
        const fileExtension = fileName.split('.').pop();
        
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          return 'Please select a valid Excel or CSV file';
        }
        
        if (value.size > 10 * 1024 * 1024) {
          return 'File size must be less than 10MB';
        }
        
        return null;
      }
    },
    {
      name: 'remarks',
      label: 'Remarks',
      type: 'textarea',
      placeholder: 'Enter any remarks about this import (optional)',
      required: false,
      rows: 3
    }
  ];

  // Edit form fields (all fields for editing existing records)
  const getEditFormFields = (): FormField[] => [
    {
      name: 'fileName',
      label: 'File Name',
      type: 'text',
      placeholder: 'Enter file name',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'File name must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'fileType',
      label: 'File Type',
      type: 'select',
      placeholder: 'Select file type',
      required: true,
      options: [
        { value: 'xlsx', label: 'Excel (.xlsx)' },
        { value: 'xls', label: 'Excel (.xls)' },
        { value: 'csv', label: 'CSV (.csv)' }
      ]
    },
    {
      name: 'filePath',
      label: 'File Path',
      type: 'text',
      placeholder: 'Enter file path',
      required: true,
      disabled: true // Make it read-only since it's auto-generated
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'Select status',
      required: false,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' }
      ]
    },
    {
      name: 'errorCount',
      label: 'Error Count',
      type: 'number',
      placeholder: 'Enter error count',
      required: false
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
    // {
    //   key: 'ImportID',
    //   label: 'ID',
    //   sortable: true,
    //   render: (value: number) => (
    //     <span className="font-medium text-gray-900">
    //       {String(value).padStart(3, '0')}
    //     </span>
    //   )
    // },
    {
      key: 'FileName',
      label: 'File Name',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    // {
    //   key: 'FileType',
    //   label: 'File Type',
    //   sortable: true,
    //   filterable: true,
    //   render: (value: string) => (
    //     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase">
    //       {value}
    //     </span>
    //   )
    // },
    // {
    //   key: 'Status',
    //   label: 'Status',
    //   sortable: true,
    //   filterable: true,
    //   render: (value: string) => {
    //     const statusColors = {
    //       pending: 'bg-yellow-100 text-yellow-800',
    //       processing: 'bg-blue-100 text-blue-800',
    //       completed: 'bg-green-100 text-green-800',
    //       failed: 'bg-red-100 text-red-800'
    //     };
        
    //     const colorClass = statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
        
    //     return (
    //       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
    //         {value}
    //       </span>
    //     );
    //   }
    // },
    // {
    //   key: 'ErrorCount',
    //   label: 'Errors',
    //   sortable: true,
    //   render: (value: number | null) => (
    //     <span className={`font-medium ${(value && value > 0) ? 'text-red-600' : 'text-green-600'}`}>
    //       {value || 0}
    //     </span>
    //   )
    // },
    {
      key: 'ImportDate',
      label: 'Import Date',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-600">
          {value ? new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'N/A'}
        </span>
      )
    },
    {
      key: 'Remarks',
      label: 'Remarks',
      sortable: false,
      render: (value: string | null) => (
        <span className="text-gray-600 max-w-xs truncate" title={value || ''}>
          {value || 'N/A'}
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
      // {
      //   label: (
      //     <span className="flex items-center gap-2">
      //       <Eye size={16} />
      //     </span>
      //   ),
      //   onClick: (importFile: ImportFile) => {
      //     handleViewImportFile(importFile);
      //   },
      //   variant: 'secondary'
      // },
      // {
      //   label: (
      //     <span className="flex items-center gap-2">
      //       <Pencil size={16} />
      //     </span>
      //   ),
      //   onClick: (importFile: ImportFile) => {
      //     handleEditImportFile(importFile);
      //   },
      //   variant: 'primary'
      // },
      // {
      //   label: (
      //     <span className="flex items-center gap-2">
      //       <Trash2 size={16} />
      //     </span>
      //   ),
      //   onClick: (importFile: ImportFile) => {
      //     if (isDeleting === importFile.ImportID) {
      //       return;
      //     }
      //     handleDeleteImportFile(importFile);
      //   },
      //   variant: 'danger'
      // }
    ];
  };

  const actions = getActions();

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create import file clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedImportFile(null);
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const importData = await fetchImportFiles();
      setImportFiles(importData.items);
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
            Only stockkeepers can access import management.
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
                  <h1 className="text-3xl font-bold text-gray-900">Import Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage file imports and track their processing status
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table
                data={importFiles}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No import files found. Upload your first file to get started."
                //onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                //createButtonLabel="Upload File"
                className="border border-gray-200"
              />
            </div>
          </div>
        </main>
      </div>

      
      

     

      
    </div>
  );
};

export default ImportPage;










