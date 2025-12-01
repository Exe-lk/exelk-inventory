'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table, { TableColumn, ActionButton } from '@/components/Table/table';
import SidebarWrapper from '@/components/Common/SidebarWraper';
import Navbar from '@/components/Common/navbar';
import Login from '@/components/login/login';
import Form, { FormField } from '@/components/form-popup/create';
import { Employee, Role, hasAdminAccess, isSuperAdmin, isAdmin, isStockKeeper } from '@/types/user';
import { fetchEmployees, fetchRoles, deleteEmployee } from '@/lib/services/employeeService';
import { getCurrentUser, logoutUser } from '@/lib/auth';

const CreateAccountPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication and authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Only SuperAdmin and Admin can access create-account page
          if (!isSuperAdmin(user.RoleID) && !isAdmin(user.RoleID)) {
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

  // Fetch employee and role data from Supabase
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both employees and roles concurrently
        const [employeesData, rolesData] = await Promise.all([
          fetchEmployees(),
          fetchRoles()
        ]);
        
        setEmployees(employeesData);
        setRoles(rolesData);
        
        console.log('Loaded employees:', employeesData.length);
        console.log('Loaded roles:', rolesData.length);
        
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
    // Check if user has admin access before setting logged in
    if (!isSuperAdmin(user.RoleID) && !isAdmin(user.RoleID)) {
      alert('Access denied. Only SuperAdmin and Admin can access employee management.');
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

  // Helper function to get role name by RoleID
  const getRoleName = (roleID: number): string => {
    const role = roles.find(r => r.RoleID === roleID);
    return role ? role.RoleName : `Role ${roleID}`;
  };

  // Helper function to get employee username by EmployeeID
  const getEmployeeUserName = (employeeID: number): string => {
    const employee = employees.find(emp => emp.EmployeeID === employeeID);
    return employee ? employee.UserName : `Emp ${employeeID}`;
  };

  // Update role filter for employee creation form
  const getRoleOptions = () => {
    if (!currentUser) return [];
    
    if (isSuperAdmin(currentUser.RoleID)) {
      // SuperAdmin can create Admin and Stockkeeper accounts
      return roles.filter(role => role.RoleID === 2 || role.RoleID === 3); // Admin and Stockkeeper
    } else if (isAdmin(currentUser.RoleID)) {
      // Admin can only create Stockkeeper accounts
      return roles.filter(role => role.RoleID === 3); // Stockkeeper only
    }
    
    return [];
  };

  // Handle employee deletion
  const handleDeleteEmployee = async (employee: Employee) => {
    // Prevent deletion of super admin account
    if (isSuperAdmin(employee.RoleID)) {
      alert('Cannot delete SuperAdmin account.');
      return;
    }

    // Admin cannot delete other Admin accounts
    if (isAdmin(currentUser?.RoleID || 0) && isAdmin(employee.RoleID)) {
      alert('Admin users cannot delete other Admin accounts.');
      return;
    }

    if (!confirm(`Are you sure you want to delete employee ${employee.UserName}?`)) {
      return;
    }

    try {
      setIsDeleting(employee.EmployeeID);
      await deleteEmployee(employee.EmployeeID);
      
      // Remove from local state
      setEmployees(prev => prev.filter(emp => emp.EmployeeID !== employee.EmployeeID));
      
      console.log('Employee deleted successfully');
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle create employee form submission
  const handleCreateEmployee = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      // Validate role selection based on current user's permissions
      const selectedRoleId = formData.roleId;
      const allowedRoles = getRoleOptions();
      
      if (!allowedRoles.some(role => role.RoleID === selectedRoleId)) {
        alert('You do not have permission to create an account with this role.');
        return;
      }
      
      // TODO: Replace this with actual API call to create employee
      console.log('Creating employee with data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Add actual employee creation logic here
      // const newEmployee = await createEmployee(formData);
      // setEmployees(prev => [...prev, newEmployee]);
      
      // Close form and show success message
      setIsCreateFormOpen(false);
      alert('Employee created successfully!');
      
      // Refresh data to get the new employee
      await refreshData();
      
    } catch (err) {
      console.error('Error creating employee:', err);
      alert('Failed to create employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define form fields for employee creation with dynamic role options
  const getFormFields = (): FormField[] => [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Enter username',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 3) {
          return 'Username must be at least 3 characters long';
        }
        return null;
      }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter email address',
      required: true
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Enter password',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 6) {
          return 'Password must be at least 6 characters long';
        }
        return null;
      }
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm password',
      required: true,
      validation: (value: string) => {
        // This will be handled in the form submission validation
        return null;
      }
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'phone',
      placeholder: 'Enter phone number',
      required: false
    },
    {
      name: 'roleId',
      label: 'Role',
      type: 'select',
      placeholder: 'Select a role',
      required: true,
      options: getRoleOptions().map(role => ({
        label: role.RoleName,
        value: role.RoleID
      }))
    }
  ];

  // Define table columns
  const columns: TableColumn[] = [
    {
      key: 'EmployeeID',
      label: 'Employee ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(3, '0')}
        </span>
      )
    },
    {
      key: 'Email',
      label: 'Email',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="text-gray-600">{value}</span>
      )
    },
    {
      key: 'Phone',
      label: 'Phone Number',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900">
          {value ? value.replace(/^\+1/, '0') : 'N/A'}
        </span>
      )
    },
    {
      key: 'UserName',
      label: 'Username',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="text-gray-900 font-medium">{value}</span>
      )
    },
    {
      key: 'RoleID',
      label: 'Role',
      sortable: true,
      filterable: true,
      render: (value: number) => {
        let colorClass = 'bg-blue-100 text-blue-800';
        if (isSuperAdmin(value)) {
          colorClass = 'bg-purple-100 text-purple-800';
        } else if (isAdmin(value)) {
          colorClass = 'bg-orange-100 text-orange-800';
        } else if (isStockKeeper(value)) {
          colorClass = 'bg-green-100 text-green-800';
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {getRoleName(value)}
          </span>
        );
      }
    },
    {
      key: 'CreatedBy',
      label: 'Created By',
      sortable: true,
      render: (value: number, row: Employee) => {
        if (value === 1 && row.EmployeeID === 1) {
          return <span className="text-gray-600 italic">System</span>;
        }
        return (
          <span className="text-gray-900">
            {getEmployeeUserName(value)}
          </span>
        );
      }
    },
    {
      key: 'CreatedDate',
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

  // Define action buttons with role-based restrictions
  const getActions = (): ActionButton[] => {
    const baseActions: ActionButton[] = [
      {
        label: 'Edit',
        onClick: (row: Employee) => {
          console.log('Edit employee:', row);
          alert(`Edit functionality for ${row.UserName} will be implemented soon`);
        },
        variant: 'primary'
      }
    ];

    // Add delete action with restrictions
    baseActions.push({
      label: 'Delete',
      onClick: (row: Employee) => {
        // SuperAdmin cannot be deleted
        if (isSuperAdmin(row.RoleID)) {
          alert('SuperAdmin accounts cannot be deleted.');
          return;
        }
        
        // Admin cannot delete other Admin accounts
        if (isAdmin(currentUser?.RoleID || 0) && isAdmin(row.RoleID)) {
          alert('You cannot delete other Admin accounts.');
          return;
        }
        
        handleDeleteEmployee(row);
      },
      variant: 'danger'
    });

    return baseActions;
  };

  const actions = getActions();

  const handleCreateAccount = () => {
    const allowedRoles = getRoleOptions();
    if (allowedRoles.length === 0) {
      alert('You do not have permission to create any accounts.');
      return;
    }
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  // Refresh data (keep the function for error retry)
  const refreshData = async () => {
    try {
      setLoading(true);
      const [employeesData, rolesData] = await Promise.all([
        fetchEmployees(),
        fetchRoles()
      ]);
      setEmployees(employeesData);
      setRoles(rolesData);
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
  if (!isSuperAdmin(currentUser?.RoleID || 0) && !isAdmin(currentUser?.RoleID || 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-4xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access employee management. 
            Only SuperAdmin and Admin can view this page.
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
        {/* Navbar */}
        <Navbar 
          currentUser={currentUser}
          onMenuClick={toggleSidebar}
        />

        {/* Role-based Sidebar */}
        <SidebarWrapper
          currentUser={currentUser}
          onLogout={handleLogout} 
          isMobileOpen={isSidebarOpen}
          onMobileClose={closeMobileSidebar}
          onExpandedChange={handleSidebarExpandChange}
        />

        {/* Main Content with Error */}
        <div 
          className={`pt-[70px] transition-all duration-300 ease-in-out ${
            isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'
          }`}
        >
          <main className="overflow-y-auto bg-gray-50 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="text-center">
                  <div className="text-red-500 text-xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <div className="space-x-4">
                    <button
                      onClick={refreshData}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
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
      {/* Navbar - Full width at top */}
      <Navbar 
        currentUser={currentUser}
        onMenuClick={toggleSidebar}
      />

      {/* Role-based Sidebar - Below navbar */}
      <SidebarWrapper
        currentUser={currentUser}
        onLogout={handleLogout} 
        isMobileOpen={isSidebarOpen}
        onMobileClose={closeMobileSidebar}
        onExpandedChange={handleSidebarExpandChange}
      />

      {/* Main Content - Dynamically adjust based on sidebar state */}
      <div 
        className={`pt-[70px] transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'lg:ml-[300px]' : 'lg:ml-16'
        }`}
      >
        <main className="overflow-y-auto bg-gray-50 p-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
          <div className="max-w-full">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage employee accounts and permissions
                  </p>
                  {/* Role permission indicator */}
                  <div className="mt-2">
                    <span className="text-sm text-blue-600 font-medium">
                      {isSuperAdmin(currentUser?.RoleID || 0) 
                        ? 'You can create Admin and Stockkeeper accounts' 
                        : 'You can create Stockkeeper accounts only'
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">
                    {employees.length} employees
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table
                data={employees}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No employees found. Create your first employee account to get started."
                onCreateClick={handleCreateAccount}
                createButtonLabel="Create Employee"
                className="border border-gray-200"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Create Employee Form Popup */}
      {isCreateFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseCreateForm}
          ></div>
          
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
                  fields={getFormFields()}
                  onSubmit={handleCreateEmployee}
                  onClear={() => {}}
                  title={`Create New Employee ${isSuperAdmin(currentUser?.RoleID || 0) ? '(Admin/Stockkeeper)' : '(Stockkeeper only)'}`}
                  submitButtonLabel="Create"
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

export default CreateAccountPage;