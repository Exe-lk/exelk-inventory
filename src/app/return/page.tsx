'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table, { TableColumn, ActionButton } from '@/components/Table/table';
import SidebarWrapper from '@/components/Common/SidebarWraper';
import Navbar from '@/components/Common/navbar';
import Login from '@/components/login/login';
import DeleteConfirmation from '@/components/form-popup/delete';
import { Employee, isStockKeeper } from '@/types/user';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { fetchReturns, createReturn, updateReturn, deleteReturn, fetchProducts, fetchSuppliers, fetchVariationsByProductId, fetchProductVariations, fetchReturnDetailsById } from '@/lib/services/returnService';
import { ReturnResponse, CreateReturnRequest, UpdateReturnRequest, ReturnStatus, ReturnType } from '@/types/return';
import { Pencil, Eye, Trash2 } from 'lucide-react';

// Interfaces matching the stock page pattern
interface Return extends ReturnResponse {
  // Display fields
  supplierName?: string;
  employeeName?: string;
}

interface Product {
  productId: number;
  productName: string;
  variations?: ProductVariation[];
}

interface ProductVariation {
  variationId: number;
  variationName: string;
  color?: string;
  size?: string;
  capacity?: string;
  price?: number;
  versionId?: number;
  isActive?: boolean;
}

interface Supplier {
  supplierId: number;
  supplierName: string;
}

interface ReturnFormData {
  returnId: string;
  returnDate: string;
  returnType: string;
  supplierId: number;
  remarks: string;
  stockKeeper: string;
  items: ReturnItem[];
}

interface ReturnItem {
  id: string;
  //productId: number;
  variationId: number;
  quantity: number;
  reason: string;
  remarks: string;
}

const ReturnPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [returns, setReturns] = useState<Return[]>([]);
  //const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  

  // View Return Details states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewReturnDetails, setViewReturnDetails] = useState<any[]>([]);
  const [viewingReturn, setViewingReturn] = useState<Return | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<Return | null>(null);

  // Helper functions to get names from IDs - matching stock and product page pattern
  const getSupplierName = (supplierID: number): string => {
    const supplier = suppliers.find(s => s.supplierId === supplierID);
    return supplier ? supplier.supplierName : `Supplier ${supplierID}`;
  };

  const getReturnTypeName = (returnType: string | null): string => {
    if (!returnType) return 'N/A';
    // Convert enum values to readable names
    switch (returnType) {
      case 'SUPPLIER_RETURN': return 'Supplier Return';
      case 'DAMAGED_RETURN': return 'Damaged Return';
      //case 'EXPIRED_RETURN': return 'Expired Return';
      case 'DEFECTIVE_RETURN': return 'Defective Return';
      //case 'CUSTOMER_RETURN': return 'Customer Return';
      case 'OTHER': return 'Other';
      default: return returnType;
    }
  };

  const getReturnStatusName = (status: string | null): string => {
    if (!status) return 'N/A';
    // Convert enum values to readable names
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  // Check authentication
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

  // Load data
  // useEffect(() => {
  //   if (!isLoggedIn) return;

  //   const loadData = async () => {
  //     try {
  //       setLoading(true);
  //       setError(null);
        
  //       // Load all required data in parallel
  //       const [returnData, productsData, suppliersData] = await Promise.all([
  //         fetchReturns({
  //           page: 1,
  //           limit: 100
  //         }),
  //         fetchProducts(),
  //         fetchSuppliers()
  //       ]);
        
  //       setReturns(returnData.items);
        
  //       // Map products correctly
  //       setProducts(productsData.map((p: any) => ({
  //         productId: p.productId,
  //         productName: p.productName || p.ProductName,
  //         variations: p.variations || []
  //       })));
        
  //       console.log(' Raw suppliers data:', suppliersData);

  //       // Map suppliers correctly  
  //       const mappedSuppliers = suppliersData.map((s: any) => {
  //         console.log(' Processing supplier:', s);
  //         return {
  //           supplierId: s.supplierId || s.SupplierID,
  //           supplierName: s.supplierName || s.SupplierName
  //         };
  //       });
        
  //       console.log(' Mapped suppliers:', mappedSuppliers);
  //       setSuppliers(mappedSuppliers);

  //       console.log('Loaded data:', {
  //         returns: returnData.items.length,
  //         products: productsData.length,
  //         suppliers: mappedSuppliers.length
  //       });
        
  //     } catch (err) {
  //       console.error('Error loading data:', err);
  //       setError(err instanceof Error ? err.message : 'Failed to load data');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadData();
  // }, [isLoggedIn]);





useEffect(() => {
  if (!isLoggedIn) return;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all required data in parallel
      const [returnData, variationsData, suppliersData] = await Promise.all([
        fetchReturns({
          page: 1,
          limit: 100
        }),
        fetchProductVariations(), // Use fetchProductVariations instead of fetchProducts
        fetchSuppliers()
      ]);
      
      setReturns(returnData.items);
      
      // Map variations correctly
      setVariations(variationsData.filter(v => v.isActive !== false));
      
      console.log(' Raw suppliers data:', suppliersData);

      // Map suppliers correctly  
      const mappedSuppliers = suppliersData.map((s: any) => {
        console.log(' Processing supplier:', s);
        return {
          supplierId: s.supplierId || s.SupplierID,
          supplierName: s.supplierName || s.SupplierName
        };
      });
      
      console.log(' Mapped suppliers:', mappedSuppliers);
      setSuppliers(mappedSuppliers);

      console.log('Loaded data:', {
        returns: returnData.items.length,
        variations: variationsData.length,
        suppliers: mappedSuppliers.length
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


  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access return management.');
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

  // Return handlers
  const handleDeleteReturn = async (returnItem: Return) => {
    setReturnToDelete(returnItem);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!returnToDelete) return;

    try {
      setIsDeleting(returnToDelete.returnId);
      await deleteReturn(returnToDelete.returnId);
      
      setReturns(prev => prev.filter(ret => ret.returnId !== returnToDelete.returnId));
      
      setIsDeleteModalOpen(false);
      setReturnToDelete(null);
      
      alert('Return deleted successfully!');
    } catch (err) {
      console.error('Error deleting return:', err);
      alert('Failed to delete return. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setReturnToDelete(null);
  };

  const handleUpdateReturn = (returnItem: Return) => {
    setSelectedReturn(returnItem);
    setIsUpdateFormOpen(true);
  };

  // Form handlers - matching stock/product page pattern
  const handleCreateClick = () => {
    console.log('Create return clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
    setSelectedReturn(null);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedReturn(null);
  };

  

  // Handle View Return Details
  // const handleViewReturnDetails = async (returnItem: Return) => {
  //   try {
  //     console.log(' Viewing return details for:', returnItem);
  //     setViewingReturn(returnItem);
  //     setIsLoadingDetails(true);
  //     setIsViewModalOpen(true);
      
  //     // Fetch return details
  //     const details = await fetchReturnDetailsById(returnItem.returnId);
  //     console.log(' Fetched return details:', details);
  //     setViewReturnDetails(details.details || []);
      
  //   } catch (error) {
  //     console.error(' Error fetching return details:', error);
  //     alert('Failed to load return details. Please try again.');
  //     setIsViewModalOpen(false);
  //   } finally {
  //     setIsLoadingDetails(false);
  //   }
  // };

  // Update this function in page.tsx
  const handleViewReturnDetails = async (returnItem: Return) => {
    try {
      console.log(' Starting to view return details for:', returnItem);
      setViewingReturn(returnItem);
      setIsLoadingDetails(true);
      setIsViewModalOpen(true);
      
      // Use the existing details from returnItem if available
      if (returnItem.details && returnItem.details.length > 0) {
        console.log(' Using existing details from return item:', returnItem.details);
        setViewReturnDetails(returnItem.details);
        setIsLoadingDetails(false);
        return;
      }
      
      // Otherwise fetch details
      console.log(' Fetching return details from API...');
      const response = await fetchReturnDetailsById(returnItem.returnId);
      console.log(' Fetched return details response:', response);
      
      if (response && response.details) {
        console.log(' Setting return details:', response.details);
        setViewReturnDetails(response.details);
      } else if (response && response.return && response.return.details) {
        console.log(' Setting return details from nested structure:', response.return.details);
        setViewReturnDetails(response.return.details);
      } else {
        console.warn(' No details found in response, using empty array');
        setViewReturnDetails([]);
      }
      
    } catch (error) {
      console.error(' Error fetching return details:', error);
      alert('Failed to load return details. Please try again.');
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingReturn(null);
    setViewReturnDetails([]);
    setIsLoadingDetails(false);
  };



  // Refresh returns data - matching stock/product page pattern
  const refreshReturns = async () => {
    try {
      const returnData = await fetchReturns({
        page: 1,
        limit: 100
      });
      setReturns(returnData.items);
    } catch (error) {
      console.error('Error refreshing returns:', error);
    }
  };

  // Refresh data function - matching product page pattern
  // const refreshData = async () => {
  //   try {
  //     setLoading(true);
  //     const [returnData, productsData, suppliersData] = await Promise.all([
  //       fetchReturns({ page: 1, limit: 100 }),
  //       fetchProducts(),
  //       fetchSuppliers()
  //     ]);
      
  //     setReturns(returnData.items);
  //     setProducts(productsData.map((p: any) => ({
  //       productId: p.productId,
  //       productName: p.productName || p.ProductName,
  //       variations: p.variations || []
  //     })));
      
  //     const mappedSuppliers = suppliersData.map((s: any) => ({
  //       supplierId: s.supplierId || s.SupplierID,
  //       supplierName: s.supplierName || s.SupplierName
  //     }));
  //     setSuppliers(mappedSuppliers);
  //     setError(null);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to refresh data');
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  // Update refreshData function

const refreshData = async () => {
  try {
    setLoading(true);
    const [returnData, variationsData, suppliersData] = await Promise.all([
      fetchReturns({ page: 1, limit: 100 }),
      fetchProductVariations(), // Changed from fetchProducts
      fetchSuppliers()
    ]);
    
    setReturns(returnData.items);
    
    // Update this part:
    setVariations(variationsData.filter(v => v.isActive !== false));
    
    const mappedSuppliers = suppliersData.map((s: any) => ({
      supplierId: s.supplierId || s.SupplierID,
      supplierName: s.supplierName || s.SupplierName
    }));
    setSuppliers(mappedSuppliers);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to refresh data');
  } finally {
    setLoading(false);
  }
};

  // Define table columns - matching stock/product page pattern
  const columns: TableColumn[] = [
    {
      key: 'returnId',
      label: 'Return ID',
      sortable: true,
      
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(3, '0')}
        </span>
      )
    },
    {
      key: 'variationId',
      label: 'Variation ID',
      sortable: true,
      filterable: true,
      render: (value: number, row: Return) => (
        <span className="font-medium text-gray-900">
          {row.details[0]?.variationId?.toString().padStart(3, '0') || 'N/A'}
        </span>
      )
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      sortable: true,
      filterable: true,
      render: (value: number, row: Return) => (
        <div>
          <span className="font-medium text-gray-900">
            {row.supplier?.supplierName || getSupplierName(row.supplier?.supplierId || 0)}
          </span>
          {row.supplier?.supplierId && (
            <div className="text-sm text-gray-500">
              ID: {String(row.supplier.supplierId).padStart(4, '0')}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'returnedBy',
      label: 'Stockkeeper ID',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(4, '0')}
        </span>
      )
    },
    {
      key: 'returnType',
      label: 'Return Type',
      sortable: true,
      filterable: true,
      render: (value: string | null) => (
        <span className="text-gray-600">{getReturnTypeName(value)}</span>
      )
    },
    {
      key: 'returnDate',
      label: 'Return Date',
      sortable: true,
      filterable: true,
      render: (value: string | null) => (
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
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      render: (value: any, row: Return) => (
        <span className="font-medium text-gray-900">
          {row.details.reduce((total, detail) => total + (detail.quantityReturned || 0), 0)}
        </span>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      sortable: true,
      
      render: (value: string | null) => (
        <span className="text-gray-600">{value || 'N/A'}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value: string | null) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          value === 'APPROVED' ? 'bg-green-100 text-green-800' :
          value === 'REJECTED' ? 'bg-red-100 text-red-800' :
          value === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
          value === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {getReturnStatusName(value)}
        </span>
      )
    }
  ];

  // Define action buttons - matching stock/product page pattern
  const getActions = (): ActionButton[] => {
  if (!isStockKeeper(currentUser?.RoleID || 0)) {
    return [];
  }
  
  return [
    {
      label: (
        <span className="flex items-center gap-2">
          <Eye size={16} />
          
        </span>
      ),
      onClick: (returnItem: Return) => {
        if (isDeleting === returnItem.returnId) {
          return;
        }
        handleViewReturnDetails(returnItem);
      },
      variant: 'secondary'
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <Pencil size={16} />
          
        </span>
      ),
      onClick: (returnItem: Return) => {
        handleUpdateReturn(returnItem);
      },
      variant: 'primary'
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <Trash2 size={16} />
          
        </span>
      ),
      onClick: (returnItem: Return) => {
        if (isDeleting === returnItem.returnId) {
          return;
        }
        handleDeleteReturn(returnItem);
      },
      variant: 'danger'
    }
  ];
};
  const actions = getActions();

  // Create Return Form Component
  const CreateReturnForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState<ReturnFormData>({
      returnId: 'Auto-generated',
      returnDate: '',
      returnType: '',
      supplierId: 0,
      remarks: '',
      stockKeeper: currentUser?.UserName || '[User]',
      items: [{
        id: '1',
        //productId: 0,
        variationId: 0,
        quantity: 0,
        reason: '',
        remarks: ''
      }]
    });

    // State for managing variations for each item
    //const [itemVariations, setItemVariations] = useState<{ [itemId: string]: ProductVariation[] }>({});
    //const [loadingVariations, setLoadingVariations] = useState<{ [itemId: string]: boolean }>({});

    const addItem = () => {
      const newItem: ReturnItem = {
        id: Date.now().toString(),
        //productId: 0,
        variationId: 0,
        quantity: 0,
        reason: '',
        remarks: ''
      };
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    };

    // const updateItem = async (id: string, field: keyof ReturnItem, value: any) => {
    //   setFormData(prev => ({
    //     ...prev,
    //     items: prev.items.map(item => {
    //       if (item.id === id) {
    //         const updatedItem = { ...item, [field]: value };
            
    //         // If product changed, reset variation and load new variations
    //         if (field === 'productId' && value !== item.productId) {
    //           updatedItem.variationId = null;
              
    //           // Load variations for the new product
    //           if (value && value > 0) {
    //             loadVariationsForItem(id, value);
    //           } else {
    //             setItemVariations(prev => ({ ...prev, [id]: [] }));
    //           }
    //         }
            
    //         return updatedItem;
    //       }
    //       return item;
    //     })
    //   }));
    // };

    const updateItem = (id: string, field: keyof ReturnItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
    };

    // const loadVariationsForItem = async (itemId: string, productId: number) => {
    //   try {
    //     setLoadingVariations(prev => ({ ...prev, [itemId]: true }));
    //     const variations = await fetchVariationsByProductId(productId);
    //     setItemVariations(prev => ({
    //       ...prev,
    //       [itemId]: variations
    //     }));
    //   } catch (error) {
    //     console.error(`Error loading variations for item ${itemId}:`, error);
    //     setItemVariations(prev => ({ ...prev, [itemId]: [] }));
    //   } finally {
    //     setLoadingVariations(prev => ({ ...prev, [itemId]: false }));
    //   }
    // };

    // const removeItem = (id: string) => {
    //   if (formData.items.length === 1) return; // Don't remove the last item
      
    //   setFormData(prev => ({
    //     ...prev,
    //     items: prev.items.filter(item => item.id !== id)
    //   }));
      
    //   // Clean up variations state
    //   setItemVariations(prev => {
    //     const newState = { ...prev };
    //     delete newState[id];
    //     return newState;
    //   });
      
    //   setLoadingVariations(prev => {
    //     const newState = { ...prev };
    //     delete newState[id];
    //     return newState;
    //   });
    // };

    const removeItem = (id: string) => {
    if (formData.items.length === 1) return; // Don't remove the last item
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
    };

    const handleSubmit = async () => {
      try {
        setIsSubmitting(true);

        // Client-side validation
        if (!formData.supplierId || formData.supplierId <= 0) {
          alert('Please select a supplier');
          return;
        }
        
        if (!formData.returnDate) {
          alert('Please select a return date');
          return;
        }
        
        if (formData.items.length === 0) {
          alert('Please add at least one item');
          return;
        }

        // Validate all items
        for (const item of formData.items) {
          if (!item.variationId || item.variationId <= 0) {
            alert('Please select a product for all items');
            return;
          }
          if (!item.quantity || item.quantity <= 0) {
            alert('Please enter a valid quantity for all items');
            return;
          }
          if (!item.reason) {
            alert('Please enter a reason for all items');
            return;
          }
        }

        const createData: CreateReturnRequest = {
          supplierId: formData.supplierId,
          returnType: formData.returnType || ReturnType.SUPPLIER_RETURN,
          returnDate: formData.returnDate,
          reason: formData.items[0].reason,
          remarks: formData.remarks,
          returnStatus: ReturnStatus.PENDING,
          approved: false,
          details: formData.items.map(item => ({
            variationId: item.variationId, 
            quantity: item.quantity,
            remarks: item.remarks
          }))
        };

        console.log(' Creating return with data:', createData);

        await createReturn(createData);

        alert('Return created successfully!');
        await refreshReturns();
        onClose();
      } catch (error) {
        console.error('Error creating return:', error);
        alert(`Failed to create return: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    const getProductDisplayName = (productName: string, productSku?: string): string => {
    if (productSku) {
      return `${productName} (${productSku})`;
    }
    return productName || 'Unnamed Product';
    };

    // Helper function to get variation display name
    const getVariationDisplayName = (variation: ProductVariation): string => {
    let displayName = variation.variationName;
    
    const details = [];
    if (variation.color) details.push(`Color: ${variation.color}`);
    if (variation.size) details.push(`Size: ${variation.size}`);
    if (variation.capacity) details.push(`Capacity: ${variation.capacity}`);
    
    if (details.length > 0) {
      displayName += ` (${details.join(', ')})`;
    }
    
    return displayName;
    };

    return (
      <div className="bg-white p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">Create Return</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Return ID</label>
            <input
              type="text"
              value={formData.returnId}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Return Date *</label>
            <input
              type="date"
              value={formData.returnDate}
              onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Return Type</label>
            <select
              value={formData.returnType}
              onChange={(e) => setFormData(prev => ({ ...prev, returnType: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              <option value={ReturnType.SUPPLIER_RETURN}>Supplier Return</option>
              <option value={ReturnType.DAMAGED_RETURN}>Damaged Return</option>
              {/* <option value={ReturnType.EXPIRED_RETURN}>Expired Return</option> */}
              <option value={ReturnType.DEFECTIVE_RETURN}>Defective Return</option>
              {/* <option value={ReturnType.CUSTOMER_RETURN}>Customer Return</option> */}
              <option value={ReturnType.OTHER}>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
            <select
              value={formData.supplierId || ''}
              onChange={(e) => {
                const value = e.target.value;
                const supplierId = value ? parseInt(value, 10) : 0;
                setFormData(prev => ({ 
                  ...prev, 
                  supplierId: supplierId 
                }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => {
                const id = supplier.supplierId;
                const name = supplier.supplierName;
                
                if (!id || !name) {
                  console.warn('Invalid supplier data:', supplier);
                  return null;
                }
                
                return (
                  <option key={id} value={id}>
                    {name} (ID: {id})
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <input
              type="text"
              placeholder="Enter remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Keeper</label>
            <input
              type="text"
              value={formData.stockKeeper}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Product Details</h3>
            <button
              onClick={addItem}
              className="text-blue-600 text-sm font-medium hover:text-blue-800"
            >
              + Add Item
            </button>
          </div>

          <div className="grid grid-cols-6 gap-4 mb-4 text-sm font-medium text-gray-500">
            <div>Product *</div>
            <div>Quantity *</div>
            <div>Reason *</div>
            <div>Remarks</div>
            <div>Actions</div>
            <div></div>
          </div>
          
          {formData.items.map((item) => {
            //const variations = itemVariations[item.id] || [];
            //const isLoadingVars = loadingVariations[item.id] || false;
            
            return (
              <div key={item.id} className="grid grid-cols-6 gap-4 mb-4">
                {/* Product Selection */}
                <select
                  value={item.variationId || ''}
                  onChange={(e) => updateItem(item.id, 'variationId', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {/* <option value="">Select</option>
                  {products.map(product => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName} (ID: {product.productId})
                    </option> */}

                  <option value="">Select Variation</option>
                  {variations.map(variation => (
                    <option key={variation.variationId} value={variation.variationId}>
                      {getVariationDisplayName(variation)} (ID: {variation.variationId})
                    </option>
                  ))}
                </select>
                
                {/* Quantity */}
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity || ''}
                  onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
                
                {/* Reason */}
                <input
                  type="text"
                  placeholder="Value"
                  value={item.reason}
                  onChange={(e) => updateItem(item.id, 'reason', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                
                {/* Remarks */}
                <input
                  type="text"
                  placeholder="Value"
                  value={item.remarks}
                  onChange={(e) => updateItem(item.id, 'remarks', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Edit Button */}
                {/* <button
                  className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  Edit
                </button> */}

                {/* Delete Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded-md hover:bg-red-50"
                  disabled={formData.items.length === 1}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setFormData({
              returnId: 'Auto-generated',
              returnDate: '',
              returnType: '',
              supplierId: 0,
              remarks: '',
              stockKeeper: currentUser?.UserName || '[User]',
              items: [{
                id: '1',
                //productId: 0,
                variationId: 0,
                quantity: 0,
                reason: '',
                remarks: ''
              }]
            })}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Add this Update Return Form component after the Create Return Form

// Update Return Form Component
const UpdateReturnForm: React.FC<{ returnData: Return; onClose: () => void }> = ({ returnData, onClose }) => {
  const [formData, setFormData] = useState<ReturnFormData>({
    returnId: `RTN-${String(returnData.returnId).padStart(6, '0')}`,
    returnDate: returnData.returnDate || '',
    returnType: returnData.returnType || '',
    supplierId: returnData.supplier?.supplierId || 0,
    remarks: returnData.remarks || '',
    stockKeeper: currentUser?.UserName || '[User]',
    items: returnData.details?.length > 0 ? returnData.details.map((detail, index) => ({
      id: (index + 1).toString(),
      variationId: detail.variationId || 0,
      quantity: detail.quantityReturned || 0,
      reason: returnData.reason || '',
      remarks: detail.remarks || ''
    })) : [{
      id: '1',
      variationId: 0,
      quantity: 0,
      reason: returnData.reason || '',
      remarks: ''
    }]
  });

  const addItem = () => {
    const newItem: ReturnItem = {
      id: Date.now().toString(),
      variationId: 0,
      quantity: 0,
      reason: '',
      remarks: ''
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (id: string, field: keyof ReturnItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const removeItem = (id: string) => {
    if (formData.items.length === 1) return;
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Client-side validation
      if (!formData.supplierId || formData.supplierId <= 0) {
        alert('Please select a supplier');
        return;
      }
      
      if (!formData.returnDate) {
        alert('Please select a return date');
        return;
      }
      
      if (formData.items.length === 0) {
        alert('Please add at least one item');
        return;
      }

      // Validate all items
      for (const item of formData.items) {
        if (!item.variationId || item.variationId <= 0) {
          alert('Please select a product for all items');
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          alert('Please enter a valid quantity for all items');
          return;
        }
        if (!item.reason) {
          alert('Please enter a reason for all items');
          return;
        }
      }

      const updateData: UpdateReturnRequest = {
        supplierId: formData.supplierId,
        returnType: formData.returnType || ReturnType.SUPPLIER_RETURN,
        returnDate: formData.returnDate,
        reason: formData.items[0].reason,
        remarks: formData.remarks,
        details: formData.items.map(item => ({
          variationId: item.variationId, 
          quantity: item.quantity,
          remarks: item.remarks
        }))
      };

      console.log('🔄 Updating return with data:', updateData);

      await updateReturn(returnData.returnId, updateData);

      alert('Return updated successfully!');
      await refreshReturns();
      onClose();
    } catch (error) {
      console.error('Error updating return:', error);
      alert(`Failed to update return: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVariationDisplayName = (variation: ProductVariation): string => {
    let displayName = variation.variationName;
    
    const details = [];
    if (variation.color) details.push(`Color: ${variation.color}`);
    if (variation.size) details.push(`Size: ${variation.size}`);
    if (variation.capacity) details.push(`Capacity: ${variation.capacity}`);
    
    if (details.length > 0) {
      displayName += ` (${details.join(', ')})`;
    }
    
    return displayName;
  };

  return (
    <div className="bg-white p-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-700">Update Return</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Return ID</label>
          <input
            type="text"
            value={formData.returnId}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Return Date *</label>
          <input
            type="date"
            value={formData.returnDate}
            onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Return Type</label>
          <select
            value={formData.returnType}
            onChange={(e) => setFormData(prev => ({ ...prev, returnType: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            <option value={ReturnType.SUPPLIER_RETURN}>Supplier Return</option>
            <option value={ReturnType.DAMAGED_RETURN}>Damaged Return</option>
            <option value={ReturnType.DEFECTIVE_RETURN}>Defective Return</option>
            <option value={ReturnType.OTHER}>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
          <select
            value={formData.supplierId || ''}
            onChange={(e) => {
              const value = e.target.value;
              const supplierId = value ? parseInt(value, 10) : 0;
              setFormData(prev => ({ 
                ...prev, 
                supplierId: supplierId 
              }));
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Supplier</option>
            {suppliers.map(supplier => {
              const id = supplier.supplierId;
              const name = supplier.supplierName;
              
              if (!id || !name) {
                console.warn('Invalid supplier data:', supplier);
                return null;
              }
              
              return (
                <option key={id} value={id}>
                  {name} (ID: {id})
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <input
            type="text"
            placeholder="Enter remarks"
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stock Keeper</label>
          <input
            type="text"
            value={formData.stockKeeper}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            disabled
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-700">Product Details</h3>
          <button
            onClick={addItem}
            className="text-blue-600 text-sm font-medium hover:text-blue-800"
          >
            + Add Item
          </button>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-4 text-sm font-medium text-gray-500">
          <div>Product *</div>
          <div>Quantity *</div>
          <div>Reason *</div>
          <div>Remarks</div>
          <div>Actions</div>
          <div></div>
        </div>
        
        {formData.items.map((item) => {
          return (
            <div key={item.id} className="grid grid-cols-6 gap-4 mb-4">
              {/* Product Selection */}
              <select
                value={item.variationId || ''}
                onChange={(e) => updateItem(item.id, 'variationId', parseInt(e.target.value) || 0)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Variation</option>
                {variations.map(variation => (
                  <option key={variation.variationId} value={variation.variationId}>
                    {getVariationDisplayName(variation)} (ID: {variation.variationId})
                  </option>
                ))}
              </select>
              
              {/* Quantity */}
              <input
                type="number"
                placeholder="Quantity"
                value={item.quantity || ''}
                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
              
              {/* Reason */}
              <input
                type="text"
                placeholder="Reason"
                value={item.reason}
                onChange={(e) => updateItem(item.id, 'reason', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              
              {/* Remarks */}
              <input
                type="text"
                placeholder="Remarks"
                value={item.remarks}
                onChange={(e) => updateItem(item.id, 'remarks', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Delete Button */}
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded-md hover:bg-red-50"
                disabled={formData.items.length === 1}
              >
                Delete
              </button>
              <div></div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Updating...' : 'Update'}
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
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
          <div className="text-red-500 text-4xl mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Only stockkeepers can access return management.
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

  // Show error state - matching product page pattern
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
                  <h1 className="text-3xl font-bold text-gray-900">Return Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage product returns and return operations
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table
                data={returns}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No return records found. Create your first return to get started."
                onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                createButtonLabel="Create Return"
                className="border border-gray-200"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Create Return Form Popup */}
      {isCreateFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseCreateForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                <button
                  onClick={handleCloseCreateForm}
                  className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <CreateReturnForm onClose={handleCloseCreateForm} />
              </div>
            </div>
          </div>
        </div>
      )}
      


      {/* View Return Details Modal */}
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
                <h2 className="text-xl font-semibold text-gray-900">Return Details</h2>
                {viewingReturn && (
                  <p className="text-sm text-gray-500 mt-1">
                    Return ID: {String(viewingReturn.returnId).padStart(3, '0')} • 
                    Supplier: {viewingReturn.supplier?.supplierName || getSupplierName(viewingReturn.supplier?.supplierId || 0)} • 
                    Date: {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString() : 'N/A'}
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
                  <p className="text-gray-500">Loading return details...</p>
                </div>
              </div>
            ) : !viewReturnDetails || viewReturnDetails.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Return Products Found</h3>
                <p className="text-gray-500">This return doesn't have any product details yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Return Summary */}
                {viewingReturn && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Return Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return ID</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {String(viewingReturn.returnId).padStart(3, '0')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Number</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {viewingReturn.returnNumber || `RT-${String(viewingReturn.returnId).padStart(6, '0')}`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                        <p className="text-sm text-gray-900">
                          {viewingReturn.supplier?.supplierName || getSupplierName(viewingReturn.supplier?.supplierId || 0)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                        <p className="text-sm text-gray-900">
                          {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
                        <p className="text-sm text-gray-900">
                          {getReturnTypeName(viewingReturn.returnType)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          viewingReturn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          viewingReturn.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          viewingReturn.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          viewingReturn.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                          viewingReturn.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getReturnStatusName(viewingReturn.status)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stockkeeper</label>
                        <p className="text-sm text-gray-900">
                          {viewingReturn.employee?.userName || `ID: ${String(viewingReturn.returnedBy).padStart(4, '0')}`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <p className="text-sm text-gray-900">{viewingReturn.reason || 'N/A'}</p>
                      </div>
                      {viewingReturn.remarks && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                          <p className="text-sm text-gray-900">{viewingReturn.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Return Product Details Table */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Return Product Details ({viewReturnDetails.length} {viewReturnDetails.length === 1 ? 'item' : 'items'})
                  </h3>
                  
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Return Product ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Information
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Variation Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remarks
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {viewReturnDetails.map((detail, index) => (
                            <tr key={detail.returnProductId || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {String(detail.returnProductId || 'N/A').padStart(4, '0')}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {detail.productName || 'Unknown Product'}
                                    {detail.productSku && (
                                      <span className="text-gray-500"> ({detail.productSku})</span>
                                    )}
                                  </div>
                                  <div className="text-gray-500 mt-1">
                                    Product ID: {detail.productId || 'N/A'}
                                  </div>
                                  {detail.brandName && (
                                    <div className="text-gray-500">
                                      Brand: {detail.brandName}
                                    </div>
                                  )}
                                  {detail.categoryName && (
                                    <div className="text-gray-500">
                                      Category: {detail.categoryName}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {detail.variationName || 'N/A'}
                                  </div>
                                  <div className="text-gray-500 mt-1">
                                    Variation ID: {String(detail.variationId || 'N/A').padStart(3, '0')}
                                  </div>
                                  {(detail.variationColor || detail.variationSize || detail.variationCapacity) && (
                                    <div className="text-gray-500 text-xs mt-1">
                                      {[
                                        detail.variationColor && `Color: ${detail.variationColor}`,
                                        detail.variationSize && `Size: ${detail.variationSize}`,
                                        detail.variationCapacity && `Capacity: ${detail.variationCapacity}`
                                      ].filter(Boolean).join(', ')}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {(detail.quantityReturned || 0).toLocaleString()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {detail.remarks || 'No remarks'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                              Total Items Returned:
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900">
                                {viewReturnDetails.reduce((total, detail) => total + (detail.quantityReturned || 0), 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleCloseViewModal}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}


        

      

        {/* Update Return Form Popup */}
        {isUpdateFormOpen && selectedReturn && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseUpdateForm}></div>
            
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="relative bg-white rounded-lg shadow-xl">
                  <button
                    onClick={handleCloseUpdateForm}
                    className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <UpdateReturnForm returnData={selectedReturn} onClose={handleCloseUpdateForm} />
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
        title="Delete Return Record"
        message="Are you sure you want to delete this return record?"
        warningMessage="This action cannot be undone."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === returnToDelete?.returnId}
        itemName={`Return ID: ${returnToDelete?.returnId}`}
      />
    </div>
  );
};

export default ReturnPage;







// {isViewModalOpen && (
//   <div className="fixed inset-0 z-50 overflow-y-auto">
//     <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseViewModal}></div>
    
//     <div className="flex min-h-full items-center justify-center p-4">
//       <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
//         <div className="relative bg-white rounded-lg shadow-xl">
//           {/* Header */}
//           <div className="px-6 py-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-xl font-semibold text-gray-900">Return Details</h2>
//                 {viewingReturn && (
//                   <p className="text-sm text-gray-500 mt-1">
//                     Return ID: {String(viewingReturn.returnId).padStart(3, '0')} • 
//                     Supplier: {viewingReturn.supplier?.supplierName || getSupplierName(viewingReturn.supplier?.supplierId || 0)} • 
//                     Date: {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString() : 'N/A'}
//                   </p>
//                 )}
//               </div>
//               <button
//                 onClick={handleCloseViewModal}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
//           </div>

//           {/* Content */}
//           <div className="px-6 py-4">
//             {isLoadingDetails ? (
//               <div className="flex items-center justify-center py-12">
//                 <div className="flex flex-col items-center">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
//                   <p className="text-gray-500">Loading return details...</p>
//                 </div>
//               </div>
//             ) : !viewReturnDetails || viewReturnDetails.length === 0 ? (
//               <div className="text-center py-12">
//                 <div className="text-gray-400 text-xl mb-4">📄</div>
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">No Return Products Found</h3>
//                 <p className="text-gray-500">This return doesn't have any product details yet.</p>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {/* Return Summary */}
//                 {viewingReturn && (
//                   <div className="bg-gray-50 rounded-lg p-6">
//                     <h3 className="text-lg font-medium text-gray-900 mb-4">Return Summary</h3>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Return ID</label>
//                         <p className="text-sm text-gray-900 font-medium">
//                           {String(viewingReturn.returnId).padStart(3, '0')}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Return Number</label>
//                         <p className="text-sm text-gray-900 font-medium">
//                           {viewingReturn.returnNumber || `RT-${String(viewingReturn.returnId).padStart(6, '0')}`}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
//                         <p className="text-sm text-gray-900">
//                           {viewingReturn.supplier?.supplierName || getSupplierName(viewingReturn.supplier?.supplierId || 0)}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
//                         <p className="text-sm text-gray-900">
//                           {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString('en-US', {
//                             year: 'numeric',
//                             month: 'long',
//                             day: 'numeric'
//                           }) : 'N/A'}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
//                         <p className="text-sm text-gray-900">
//                           {getReturnTypeName(viewingReturn.returnType)}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                           viewingReturn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
//                           viewingReturn.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
//                           viewingReturn.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
//                           viewingReturn.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
//                           viewingReturn.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
//                           'bg-gray-100 text-gray-800'
//                         }`}>
//                           {getReturnStatusName(viewingReturn.status)}
//                         </span>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Stockkeeper</label>
//                         <p className="text-sm text-gray-900">
//                           {viewingReturn.employee?.userName || `ID: ${String(viewingReturn.returnedBy).padStart(4, '0')}`}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
//                         <p className="text-sm text-gray-900">{viewingReturn.reason || 'N/A'}</p>
//                       </div>
//                       {viewingReturn.remarks && (
//                         <div className="md:col-span-2">
//                           <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
//                           <p className="text-sm text-gray-900">{viewingReturn.remarks}</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* Return Product Details Table */}
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-900 mb-4">
//                     Return Product Details ({viewReturnDetails.length} {viewReturnDetails.length === 1 ? 'item' : 'items'})
//                   </h3>
                  
//                   <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
//                     <div className="overflow-x-auto">
//                       <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50">
//                           <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                               Return Product ID
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                               Product Information
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                               Variation Details
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                               Quantity
//                             </th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                               Remarks
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {viewReturnDetails.map((detail, index) => (
//                             <tr key={detail.returnProductId || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
//                               <td className="px-6 py-4 whitespace-nowrap">
//                                 <div className="text-sm font-medium text-gray-900">
//                                   {String(detail.returnProductId || 'N/A').padStart(4, '0')}
//                                 </div>
//                               </td>
//                               <td className="px-6 py-4">
//                                 <div className="text-sm">
//                                   <div className="font-medium text-gray-900">
//                                     {getProductDisplayName(detail.productName || 'Unknown Product', detail.productSku)}
//                                   </div>
//                                   <div className="text-gray-500 mt-1">
//                                     Product ID: {detail.productId || 'N/A'}
//                                   </div>
//                                   {detail.brandName && (
//                                     <div className="text-gray-500">
//                                       Brand: {detail.brandName}
//                                     </div>
//                                   )}
//                                   {detail.categoryName && (
//                                     <div className="text-gray-500">
//                                       Category: {detail.categoryName}
//                                     </div>
//                                   )}
//                                 </div>
//                               </td>
//                               <td className="px-6 py-4">
//                                 <div className="text-sm">
//                                   <div className="font-medium text-gray-900">
//                                     {getVariationDisplayName(detail)}
//                                   </div>
//                                   <div className="text-gray-500 mt-1">
//                                     Variation ID: {String(detail.variationId || 'N/A').padStart(3, '0')}
//                                   </div>
//                                 </div>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap">
//                                 <div className="text-sm font-medium text-gray-900">
//                                   {(detail.quantityReturned || 0).toLocaleString()}
//                                 </div>
//                               </td>
//                               <td className="px-6 py-4">
//                                 <div className="text-sm text-gray-900">
//                                   {detail.remarks || 'No remarks'}
//                                 </div>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                         <tfoot className="bg-gray-100">
//                           <tr>
//                             <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
//                               Total Items Returned:
//                             </td>
//                             <td className="px-6 py-4">
//                               <div className="text-sm font-bold text-gray-900">
//                                 {viewReturnDetails.reduce((total, detail) => total + (detail.quantityReturned || 0), 0).toLocaleString()}
//                               </div>
//                             </td>
//                             <td className="px-6 py-4"></td>
//                           </tr>
//                         </tfoot>
//                       </table>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Footer */}
//           <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
//             <button
//               onClick={handleCloseViewModal}
//               className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// )}








// {isViewModalOpen && (
//   <div className="fixed inset-0 z-50 overflow-y-auto">
//     <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseViewModal}></div>
    
//     <div className="flex min-h-full items-center justify-center p-4">
//       <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
//         <div className="relative bg-white rounded-lg shadow-xl">
//           {/* Header */}
//           <div className="px-6 py-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-xl font-semibold text-gray-900">Return Details</h2>
//                 {viewingReturn && (
//                   <p className="text-sm text-gray-500 mt-1">
//                     Return ID: {String(viewingReturn.returnId).padStart(3, '0')} • 
//                     Supplier: {viewingReturn.supplier?.supplierName || getSupplierName(viewingReturn.supplier?.supplierId || 0)} • 
//                     Date: {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString() : 'N/A'}
//                   </p>
//                 )}
//               </div>
//               <button
//                 onClick={handleCloseViewModal}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
//           </div>

//           {/* Content */}
//           <div className="px-6 py-4">
//             {isLoadingDetails ? (
//               <div className="flex items-center justify-center py-12">
//                 <div className="flex flex-col items-center">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
//                   <p className="text-gray-500">Loading return details...</p>
//                 </div>
//               </div>
//             ) : viewReturnDetails.length === 0 ? (
//               <div className="text-center py-12">
//                 <div className="text-gray-400 text-xl mb-4">📄</div>
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">No Details Found</h3>
//                 <p className="text-gray-500">This return doesn't have any product details yet.</p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {/* Return Summary */}
//                 {viewingReturn && (
//                   <div className="bg-gray-50 rounded-lg p-4 mb-6">
//                     <h3 className="text-lg font-medium text-gray-900 mb-3">Return Summary</h3>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">Return ID</label>
//                         <p className="text-sm text-gray-900 font-medium">
//                           {String(viewingReturn.returnId).padStart(3, '0')}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">Supplier</label>
//                         <p className="text-sm text-gray-900">
//                           {viewingReturn.supplier?.supplierName || getSupplierName(viewingReturn.supplier?.supplierId || 0)}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">Return Date</label>
//                         <p className="text-sm text-gray-900">
//                           {viewingReturn.returnDate ? new Date(viewingReturn.returnDate).toLocaleDateString('en-US', {
//                             year: 'numeric',
//                             month: 'long',
//                             day: 'numeric'
//                           }) : 'N/A'}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">Return Type</label>
//                         <p className="text-sm text-gray-900">
//                           {getReturnTypeName(viewingReturn.returnType)}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">Status</label>
//                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                           viewingReturn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
//                           viewingReturn.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
//                           viewingReturn.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
//                           viewingReturn.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
//                           viewingReturn.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
//                           'bg-gray-100 text-gray-800'
//                         }`}>
//                           {getReturnStatusName(viewingReturn.status)}
//                         </span>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">Stockkeeper ID</label>
//                         <p className="text-sm text-gray-900">
//                           {String(viewingReturn.returnedBy).padStart(4, '0')}
//                         </p>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">Reason</label>
//                         <p className="text-sm text-gray-900">{viewingReturn.reason || 'N/A'}</p>
//                       </div>
//                       {viewingReturn.remarks && (
//                         <div className="md:col-span-2">
//                           <label className="block text-sm font-medium text-gray-700">Remarks</label>
//                           <p className="text-sm text-gray-900">{viewingReturn.remarks}</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* Return Details Table */}
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-900 mb-3">
//                     Return Product Details ({viewReturnDetails.length} items)
//                   </h3>
//                   <div className="overflow-x-auto">
//                     <table className="min-w-full divide-y divide-gray-200">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Product Detail ID
//                           </th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Product
//                           </th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Variation
//                           </th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Quantity Returned
//                           </th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Remarks
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-gray-200">
//                         {viewReturnDetails.map((detail, index) => (
//                           <tr key={detail.returnProductId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                               {String(detail.returnProductId).padStart(4, '0')}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               <div className="text-sm font-medium text-gray-900">
//                                 {getProductDisplayName(detail.productName, detail.productSku)}
//                               </div>
//                               <div className="text-sm text-gray-500">
//                                 Product ID: {detail.productId}
//                               </div>
//                               {detail.brandName && (
//                                 <div className="text-sm text-gray-500">
//                                   Brand: {detail.brandName}
//                                 </div>
//                               )}
//                               {detail.categoryName && (
//                                 <div className="text-sm text-gray-500">
//                                   Category: {detail.categoryName}
//                                 </div>
//                               )}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               <div className="text-sm font-medium text-gray-900">
//                                 {getVariationDisplayName(detail)}
//                               </div>
//                               <div className="text-sm text-gray-500">
//                                 Variation ID: {String(detail.variationId).padStart(3, '0')}
//                               </div>
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                               {detail.quantityReturned?.toLocaleString() || 0}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                               {detail.remarks || 'N/A'}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                       <tfoot className="bg-gray-100">
//                         <tr>
//                           <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
//                             Total Items Returned:
//                           </td>
//                           <td className="px-6 py-4 text-sm font-bold text-gray-900">
//                             {viewReturnDetails.reduce((total, detail) => total + (detail.quantityReturned || 0), 0).toLocaleString()}
//                           </td>
//                           <td className="px-6 py-4"></td>
//                         </tr>
//                       </tfoot>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Footer */}
//           <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
//             <button
//               onClick={handleCloseViewModal}
//               className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// )}