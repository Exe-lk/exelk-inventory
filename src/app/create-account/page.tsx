'use client';
import React, { useState, useEffect } from 'react';
import Table, { TableColumn, ActionButton } from '@/components/Table/table';
import { Employee, Role } from '@/types/user';
import { fetchEmployees, fetchRoles, deleteEmployee } from '@/lib/services/employeeService';

const CreateAccountPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Fetch employee and role data from Supabase
  useEffect(() => {
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
  }, []);

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

  // Handle employee deletion
  const handleDeleteEmployee = async (employee: Employee) => {
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
      render: (value: number) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getRoleName(value)}
        </span>
      )
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

  // Define action buttons
  const actions: ActionButton[] = [
    {
      label: 'Edit',
      onClick: (row: Employee) => {
        console.log('Edit employee:', row);
        alert(`Edit functionality for ${row.UserName} will be implemented soon`);
      },
      variant: 'primary'
    },
    {
      label: 'Delete',
      onClick: handleDeleteEmployee,
      variant: 'danger'
    }
  ];

  const handleCreateAccount = () => {
    console.log('Create new employee account');
    alert('Create employee modal will be implemented here');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
              <p className="mt-2 text-gray-600">
                Manage employee accounts and permissions
              </p>
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
    </div>
  );
};

export default CreateAccountPage;