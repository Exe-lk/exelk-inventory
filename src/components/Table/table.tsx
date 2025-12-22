import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface ActionButton {
  label: string;
  onClick: (row: any) => void;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
}

export interface TableProps {
  data: any[];
  columns: TableColumn[];
  actions?: ActionButton[];
  itemsPerPage?: number;
  searchable?: boolean;
  filterable?: boolean;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  onCreateClick?: () => void;
  createButtonLabel?: string;
  getRowClassName?: (row: any) => string;
}

const Table: React.FC<TableProps> = ({
  data,
  columns,
  actions = [],
  itemsPerPage = 10,
  searchable = true,
  filterable = true,
  className = '',
  loading = false,
  emptyMessage = 'No data available',
  onCreateClick,
  createButtonLabel = 'Create',
  getRowClassName
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // Get display value for filtering and searching
  const getDisplayValue = (value: any, column: TableColumn, row: any): string => {
    if (column.render) {
      // For rendered columns, we need to extract the meaningful text
      if (column.key === 'RoleID') {
        // Special handling for RoleID - use the role name for filtering
        const roleNames = ['SuperAdmin', 'Admin', 'StockKeeper'];
        return roleNames[value - 1] || `Role ${value}`;
      }
      if (column.key === 'CreatedBy') {
        // Special handling for CreatedBy
        if (value === 1 && row.EmployeeID === 1) return 'System';
        return data.find(item => item.EmployeeID === value)?.UserName || `Emp ${value}`;
      }
      if (column.key === 'CreatedDate') {
        return new Date(value).toLocaleDateString();
      }
    }
    
    // Handle nested objects
    if (typeof value === 'object' && value !== null) {
      if (value.RoleName) return value.RoleName;
      if (value.name) return value.name;
      return String(value);
    }
    
    return String(value || '');
  };

  // Get unique values for filter options
  const getFilterOptions = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column) return [];

    const values = data.map(row => {
      const value = row[columnKey];
      return getDisplayValue(value, column, row);
    }).filter(Boolean);

    return [...new Set(values)].sort();
  };

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.key];
          const displayValue = getDisplayValue(value, column, row);
          return displayValue.toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        const column = columns.find(col => col.key === key);
        if (column) {
          filtered = filtered.filter(row => {
            const value = row[key];
            const displayValue = getDisplayValue(value, column, row);
            return displayValue.toLowerCase().includes(filterValue.toLowerCase());
          });
        }
      }
    });

    // Apply sorting
    if (sortColumn) {
      const column = columns.find(col => col.key === sortColumn);
      filtered.sort((a, b) => {
        let aValue = a[sortColumn];
        let bValue = b[sortColumn];
        
        if (column) {
          aValue = getDisplayValue(aValue, column, a);
          bValue = getDisplayValue(bValue, column, b);
        }
        
        // Handle numeric sorting
        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, filters, sortColumn, sortDirection, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Handle filter change
  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
    setCurrentPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Get action button styles
  const getActionButtonStyles = (variant: string = 'primary') => {
    const base = 'px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
    
    switch (variant) {
      case 'primary':
        return `${base} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
      case 'secondary':
        return `${base} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300`;
      case 'danger':
        return `${base} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      case 'warning':
        return `${base} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500`;
      default:
        return `${base} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300`;
    }
  };

  return (
    <div className={`bg-white rounded-lg overflow-hidden ${className}`}>
      {/* Header with search, filter and create button */}
      <div className="p-6 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            {/* Search Bar */}
            {searchable && (
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            )}

            {/* Filter Icon */}
            {filterable && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <FunnelIcon className="h-5 w-5 text-gray-500" />
              </button>
            )}

            {/* Clear Filters */}
            {(searchTerm || Object.values(filters).some(f => f)) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Create Button */}
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              {createButtonLabel}
            </button>
          )}
        </div>

        {/* Filter Pills Row */}
        {filterable && showFilters && (
          <div className="flex flex-wrap gap-3">
            {columns.filter(col => col.filterable).map(column => (
              <div key={column.key} className="flex items-center">
                <div className="relative">
                  <select
                    value={filters[column.key] || ''}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{column.label}</option>
                    {getFilterOptions(column.key).map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-y border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col ml-1">
                        <svg 
                          className={`w-3 h-3 ${
                            sortColumn === column.key && sortDirection === 'asc' 
                              ? 'text-gray-900' : 'text-gray-400'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${getRowClassName ? getRowClassName(row) : ''}`}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(row)}
                            className={action.className || getActionButtonStyles(action.variant)}
                          >
                            {action.icon && <span className="mr-1">{action.icon}</span>}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} results
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - 4 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-md text-sm font-medium ${
                    pageNum === currentPage
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && (
              <>
                {currentPage < totalPages - 2 && <span className="text-gray-500">...</span>}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 rounded-md text-sm font-medium ${
                    totalPages === currentPage
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Rows per page dropdown */}
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-sm text-gray-700">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;