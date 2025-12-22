
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
import { fetchStocks, createStockIn, createStockOut, deleteStock, fetchProducts, fetchSuppliers, fetchVariationsByProductId,  } from '@/lib/services/stockService';
import { Stock as StockType } from '@/types/stock';


// // Stock interfaces
// interface Stock {
//   stockId: number;
//   productId: number;
//   variationId: number | null;
//   quantityAvailable: number ;
//   reorderLevel: number;
//   lastUpdatedDate: string;
//   location: string | null;
//   // Display fields
//   productName?: string;
//   productSku?: string;
//   brandName?: string;
//   categoryName?: string;
//   variationName?: string;
//   variationColor?: string;
//   variationSize?: string;
//   variationCapacity?: string;
// }

// Stock interfaces
interface Stock extends StockType {
 
  // Display fields
  productName?: string;
  productSku?: string;
  brandName?: string;
  categoryName?: string;
  variationName?: string;
  variationColor?: string;
  variationSize?: string;
  variationCapacity?: string;
}

interface Product {
  productId: number;
  productName: string;
  variations?: ProductVariation[];
}

interface ProductVersion {
  versionId: number;
  versionName: string;
}

interface ProductVariation {
  variationId: number;
  variationName: string;
  color: string;
  size: string;
  capacity: string;
  price: number;
}

interface Supplier {
  supplierId: number;
  supplierName: string;
}

interface StockInFormData {
  grnNumber: string;
  receivedDate: string;
  stockKeeper: string;
  supplierId: number;
  remarks: string;
  items: StockInItem[];
}

interface StockInItem {
  id: string;
  productId: number;
  variationId: number | null;
  quantityReceived: number;
  unitCost: number;
  location: string;
  subtotal: number;
}

interface StockOutFormData {
  ginNumber: string;
  issueDate: string;
  issuedTo: string;
  issueReason: string;
  stockKeeper: string;
  remarks: string;
  items: StockOutItem[];
}

interface StockOutItem {
  id: string;
  productId: number;
  variationId: number | null;
  quantityIssued: number;
  unitCost: number;
  location: string;
  subtotal: number;
}

const StockPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isStockInFormOpen, setIsStockInFormOpen] = useState(false);
  const [isStockOutFormOpen, setIsStockOutFormOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<Stock | null>(null);

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
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load stocks from API
        const stockData = await fetchStocks({
          page: 1,
          limit: 100
        });
        
        // Load products and suppliers for the forms
        const [productsData, suppliersData] = await Promise.all([
          fetchProducts(),
          fetchSuppliers()
        ]);
        
        setStocks(stockData.items);
        
        // Map products correctly
        setProducts(productsData.map((p: any) => ({
          productId: p.productId,
          productName: p.productName || p.ProductName, // Handle different field names
          variations: p.variations || []
        })));
        
        // Map suppliers correctly  
        // setSuppliers(suppliersData.map((s: any) => ({
        //   supplierId: s.supplierId || s.SupplierID,
        //   supplierName: s.supplierName || s.SupplierName
        // })));

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
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };


    // Add this debugging in the useEffect where you load suppliers
// const loadData = async () => {
//   try {
//     setLoading(true);
//     setError(null);
    
//     // Load stocks from API
//     const stockData = await fetchStocks({
//       page: 1,
//       limit: 100
//     });
    
//     // Load products and suppliers for the forms
//     const [productsData, suppliersData] = await Promise.all([
//       fetchProducts(),
//       fetchSuppliers()
//     ]);
    
//     setStocks(stockData.items);
    
//     // Debug suppliers data
//     console.log(' Raw suppliers data:', suppliersData);
    
//     // Map suppliers correctly  
//     const mappedSuppliers = suppliersData.map((s: any) => {
//       console.log(' Processing supplier:', s);
//       return {
//         supplierId: s.supplierId || s.SupplierID,
//         supplierName: s.supplierName || s.SupplierName
//       };
//     });
    
//     console.log(' Mapped suppliers:', mappedSuppliers);
//     setSuppliers(mappedSuppliers);
    
//   } catch (err) {
//     console.error('Error loading data:', err);
//     setError(err instanceof Error ? err.message : 'Failed to load data');
//   } finally {
//     setLoading(false);
//   }
// };

    loadData();
  }, [isLoggedIn]);

  // Auth handlers
  const handleLogin = (user: Omit<Employee, 'Password'>) => {
    if (!isStockKeeper(user.RoleID)) {
      alert('Access denied. Only stockkeepers can access stock management.');
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

  // Stock handlers
  const handleDeleteStock = async (stock: Stock) => {
    setStockToDelete(stock);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!stockToDelete) return;

    try {
      setIsDeleting(stockToDelete.stockId);
      await deleteStock(stockToDelete.stockId);
      
      setStocks(prev => prev.filter(stock => stock.stockId !== stockToDelete.stockId));
      
      setIsDeleteModalOpen(false);
      setStockToDelete(null);
      
      alert('Stock record deleted successfully!');
    } catch (err) {
      console.error('Error deleting stock:', err);
      alert('Failed to delete stock record. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setStockToDelete(null);
  };

  // Form handlers
  const handleStockInClick = (stock?: Stock) => {
    setSelectedStock(stock || null);
    setIsStockInFormOpen(true);
  };

  const handleStockOutClick = (stock?: Stock) => {
    setSelectedStock(stock || null);
    setIsStockOutFormOpen(true);
  };

  const handleCloseStockInForm = () => {
    setIsStockInFormOpen(false);
    setSelectedStock(null);
  };

  const handleCloseStockOutForm = () => {
    setIsStockOutFormOpen(false);
    setSelectedStock(null);
  };

  // Refresh stocks data
  const refreshStocks = async () => {
    try {
      const stockData = await fetchStocks({
        page: 1,
        limit: 100
      });
      setStocks(stockData.items);
    } catch (error) {
      console.error('Error refreshing stocks:', error);
    }
  };

  // Function to get row class name based on stock levels
  const getStockRowClassName = (stock: Stock): string => {
    const quantity = stock.quantityAvailable ?? 0;
    const reorderLevel = stock.reorderLevel ?? 0;
    
    if (quantity <= reorderLevel) {
      return 'bg-red-100 border-red-200 hover:bg-red-300';
    }
    return '';
  };


  // Define table columns
  const columns: TableColumn[] = [
    {
      key: 'stockId',
      label: 'Stock ID',
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
      key: 'productName',
      label: 'Product Name',
      sortable: true,
      filterable: true,
      render: (value: string, row: Stock) => (
        <div>
          <span className="font-medium text-gray-900">{value || 'N/A'}</span>
          {/* {row.productSku && (
            <div className="text-sm text-gray-500">SKU: {row.productSku}</div>
          )} */}
        </div>
      )
    },
    // {
    //   key: 'quantityAvailable',
    //   label: 'Quantity Available',
    //   sortable: true,
    //   render: (value: number , row: Stock) => (
    //     <span className={`font-medium ${value <= row.reorderLevel ? 'text-red-600' : 'text-gray-600'}`}>
    //       {value}
    //     </span>
    //   )
    // },
    {
      key: 'quantityAvailable',
      label: 'Quantity Available',
      sortable: true,
      render: (value: number | null, row: Stock) => {
        const quantity = value ?? 0;
        const reorderLevel = row.reorderLevel ?? 0; // Handle null reorderLevel

        return (
          <span className={`font-medium ${quantity <= reorderLevel ? 'text-red-600' : 'text-gray-600'}`}>
            {quantity}
          </span>
        );
      }
    },
    
    {
      key: 'reorderLevel',
      label: 'Reorder Level',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'lastUpdatedDate',
      label: 'Last Updated',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      filterable: true,
      render: (value: string | null) => (
        <span className="text-gray-600">{value || 'N/A'}</span>
      )
    }
  ];

  // Define action buttons
  const getActions = (): ActionButton[] => {
    if (!isStockKeeper(currentUser?.RoleID || 0)) {
      return [];
    }
    
    return [
      // {
      //   label: 'Stock-IN',
      //   onClick: (stock: Stock) => {
      //     handleStockInClick(stock);
      //   },
      //   variant: 'primary'
      // },
      {
        label: 'Stock-IN',
        onClick: () => {
          handleStockInClick();
        },
        variant: 'primary'
      },
      {
        label: 'Stock-Out',
        onClick: () => {
          handleStockOutClick();
        },
        variant: 'primary'
      },
      {
        label: 'Delete',
        onClick: (stock: Stock) => {
          if (isDeleting === stock.stockId) {
            return;
          }
          handleDeleteStock(stock);
        },
        variant: 'danger'
      }
    ];
  };

  const actions = getActions();

  // Stock In Form Component with Updated Variation Loading
  const StockInForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState<StockInFormData>({
      grnNumber: 'Auto-generated',
      receivedDate: '',
      stockKeeper: currentUser?.UserName || '[User]',
      supplierId: 0, // changed that 0 into null
      remarks: '',
      items: selectedStock ? [{
        id: '1',
        productId: selectedStock.productId,
        variationId: selectedStock.variationId,
        quantityReceived: 0,
        unitCost: 0,
        location: selectedStock.location || '',
        subtotal: 0
      }] : [{
        id: '1',
        productId: 0,
        variationId: null,
        quantityReceived: 0,
        unitCost: 0,
        location: '',
        subtotal: 0
      }]
    });

    // Add state for managing variations for each item
    const [itemVariations, setItemVariations] = useState<{ [itemId: string]: ProductVariation[] }>({});
    const [loadingVariations, setLoadingVariations] = useState<{ [itemId: string]: boolean }>({});

    const addItem = () => {
      const newItem: StockInItem = {
        id: Date.now().toString(),
        productId: 0,
        variationId: null,
        quantityReceived: 0,
        unitCost: 0,
        location: '',
        subtotal: 0
      };
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    };

    // Update the updateItem function to handle product changes
    const updateItem = async (id: string, field: keyof StockInItem, value: any) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item => {
          if (item.id === id) {
            const updatedItem = { ...item, [field]: value };
            
            // If product changed, reset variation and load new variations
            if (field === 'productId' && value !== item.productId) {
              updatedItem.variationId = null;
              
              // Load variations for the new product
              if (value && value > 0) {
                loadVariationsForItem(id, value);
              } else {
                // Clear variations if no product selected
                setItemVariations(prev => ({ ...prev, [id]: [] }));
              }
            }
            
            // Calculate subtotal if quantity or cost changed
            if (field === 'quantityReceived' || field === 'unitCost') {
              updatedItem.subtotal = updatedItem.quantityReceived * updatedItem.unitCost;
            }
            
            return updatedItem;
          }
          return item;
        })
      }));
    };

    // Function to load variations for a specific item
    const loadVariationsForItem = async (itemId: string, productId: number) => {
      try {
        setLoadingVariations(prev => ({ ...prev, [itemId]: true }));
        
        console.log(` Loading variations for item ${itemId}, product ${productId}`);
        
        const variations = await fetchVariationsByProductId(productId);
        
        console.log(` Loaded ${variations.length} variations for item ${itemId}`);
        
        setItemVariations(prev => ({
          ...prev,
          [itemId]: variations
        }));
        
      } catch (error) {
        console.error(` Error loading variations for item ${itemId}:`, error);
        setItemVariations(prev => ({ ...prev, [itemId]: [] }));
      } finally {
        setLoadingVariations(prev => ({ ...prev, [itemId]: false }));
      }
    };

    const removeItem = (id: string) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
      
      // Clean up variations state
      setItemVariations(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      setLoadingVariations(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    };

    // Load initial variations if selectedStock has a product
    useEffect(() => {
      if (selectedStock && selectedStock.productId) {
        const initialItem = formData.items[0];
        if (initialItem) {
          loadVariationsForItem(initialItem.id, selectedStock.productId);
        }
      }
    }, [selectedStock]);

    const getTotalAmount = () => {
      return formData.items.reduce((total, item) => total + item.subtotal, 0);
    };

  //   const handleSubmit = async () => {
  //     try {
  //       setIsSubmitting(true);

  //       console.log(' Form data before validation:', formData);
        
  //       // Validate form
  //       if (!formData.supplierId || formData.supplierId <= 0 || !formData.receivedDate) {
  //         alert('Please fill in all required fields');
  //         return;
  //       }

  //        if (formData.items.length === 0 || formData.items.some(item => 
  //           !item.productId || item.productId <= 0 || 
  //           !item.quantityReceived || item.quantityReceived <= 0 || 
  //           !item.unitCost || item.unitCost <= 0)) {
  //           alert('Please add valid items to the stock-in (all items must have Product, Quantity > 0, and Unit Cost > 0)');
  //       return;
  //       }

  //       console.log(' Validation passed, creating stock-in...');

  //       // Submit stock-in
  //     //   await createStockIn({
  //     //     supplierId: formData.supplierId,
  //     //     receivedDate: formData.receivedDate,
  //     //     remarks: formData.remarks,
  //     //     items: formData.items.map(item => ({
  //     //       productId: item.productId,
  //     //       variationId: item.variationId,
  //     //       quantityReceived: item.quantityReceived,
  //     //       unitCost: item.unitCost,
  //     //       location: item.location
  //     //     }))
  //     //   });

  //     //   alert('Stock-In saved successfully!');
  //     //   await refreshStocks();
  //     //   onClose();
  //     // } catch (error) {
  //     //   console.error('Stock-in error:', error);
  //     //   alert(`Failed to save Stock-In: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //     // } finally {
  //     //   setIsSubmitting(false);
  //     // }


  //     // Add this inside the StockInForm component, just before the return statement
  //       console.log(' DEBUG - Current form state:', {
  //         supplierId: formData.supplierId,
  //         supplierIdType: typeof formData.supplierId,
  //         receivedDate: formData.receivedDate,
  //         suppliers: suppliers.length,
  //         firstSupplier: suppliers[0]
  //       });

  //     const stockInData = {
  //     supplierId: formData.supplierId,
  //     receivedDate: formData.receivedDate,
  //     remarks: formData.remarks,
  //     items: formData.items.map(item => ({
  //       productId: item.productId,
  //       variationId: item.variationId || null, // Ensure null for undefined variations
  //       quantityReceived: item.quantityReceived,
  //       unitCost: item.unitCost,
  //       location: item.location || '' // Ensure empty string instead of undefined
  //     }))
  //   };

  //   console.log(' Sending stock-in data:', stockInData); // Add debugging

  //   await createStockIn(stockInData);

  //   alert('Stock-In saved successfully!');
  //   await refreshStocks();
  //   onClose();
  // } catch (error) {
  //   console.error(' Stock-in error:', error);
  //   alert(`Failed to save Stock-In: ${error instanceof Error ? error.message : 'Unknown error'}`);// stock in error
  // } finally {
  //   setIsSubmitting(false);
  // }
    
  //   };


  // Update the handleSubmit function to better validate supplier data
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);

    console.log(' Form data before validation:', formData);
    console.log(' Available suppliers:', suppliers);
    
    // Enhanced supplier validation
    if (!formData.supplierId || formData.supplierId <= 0) {
      alert('Please select a valid supplier');
      return;
    }

    // Verify the supplier exists in our list
    const selectedSupplier = suppliers.find(s => 
      (s.supplierId ) === formData.supplierId
    );
    
    if (!selectedSupplier) {
      alert('Selected supplier is invalid. Please select a supplier from the list.');
      return;
    }

    if (!formData.receivedDate) {
      alert('Please select a received date');
      return;
    }

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    // Validate all items
    for (const item of formData.items) {
      if (!item.productId || item.productId <= 0) {
        alert('Please select a product for all items');
        return;
      }
      if (!item.quantityReceived || item.quantityReceived <= 0) {
        alert('Please enter a valid quantity for all items');
        return;
      }
      if (!item.unitCost || item.unitCost <= 0) {
        alert('Please enter a valid unit cost for all items');
        return;
      }
    }

    console.log(' Validation passed, creating stock-in...');

    const stockInData = {
      supplierId: parseInt(formData.supplierId.toString()), 
      stockKeeperId: currentUser!.EmployeeID, // added stockKeeperId to payload
      receivedDate: formData.receivedDate,
      remarks: formData.remarks || '',
      items: formData.items.map(item => ({
        productId: parseInt(item.productId.toString()),
        variationId: item.variationId ? parseInt(item.variationId.toString()) : undefined,
        quantityReceived: parseInt(item.quantityReceived.toString()),
        unitCost: parseFloat(item.unitCost.toString()),
        location: item.location || undefined
      }))
    };

    console.log(' Sending stock-in data:', stockInData);

    await createStockIn(stockInData);

    alert('Stock-In saved successfully!');
    await refreshStocks();
    onClose();
  } catch (error) {
    console.error(' Stock-in error:', error);
    alert(`Failed to save Stock-In: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setIsSubmitting(false);
  }
};



    return (
      <div className="bg-white p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">Create Stock - In</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GRN Number</label>
            <input
              type="text"
              value={formData.grnNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, grnNumber: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Received Date *</label>
            <input
              type="date"
              value={formData.receivedDate}
              onChange={(e) => setFormData(prev => ({ ...prev, receivedDate: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
          <div >
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
          
            <select
              value={formData.supplierId || ''}
              onChange={(e) => {
              const value = e.target.value;
              const supplierId = value ? parseInt(value, 10) : 0;
              console.log(' Supplier selected:', { value, supplierId, type: typeof supplierId }); // Add debugging
              setFormData(prev => ({ 
              ...prev, 
              supplierId: supplierId 
            }));
            }}
           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            >
              <option value="">Select Supplier</option>
              {/* {suppliers.map(supplier => (
                <option key={supplier.supplierId} value={supplier.supplierId}>
                  {supplier.supplierName}(ID: {supplier.supplierId})
                </option>
              ))} */}

              {suppliers.map(supplier => {
      // Ensure we have valid data
      const id = supplier.supplierId ;
      const name = supplier.supplierName ;
      
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

             {/* <div key={item.id} className="grid grid-cols-7 gap-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
          
            <select
              value={item.supplierId || ''}
              onChange={(e) => updatedItem(item.id, 'supplierId', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.supplierId} value={supplier.supplierId}>
                  {supplier.supplierName}(ID: {supplier.supplierId})
                </option>
              ))}
            </select>
          </div> */}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <input
              type="text"
              placeholder="Enter remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Items</h3>
            <button
              onClick={addItem}
              className="text-blue-600 text-sm font-medium hover:text-blue-800"
            >
              + Add Item
            </button>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-4 text-sm font-medium text-gray-500">
            <div>Product *</div>
            <div>Variation</div>
            <div>Quantity Received *</div>
            <div>Unit Cost *</div>
            <div>Location</div>
            <div>Subtotal</div>
            <div>Actions</div>
          </div>
          
          {formData.items.map((item) => {
            const variations = itemVariations[item.id] || [];
            const isLoadingVars = loadingVariations[item.id] || false;
            
            return (
              <div key={item.id} className="grid grid-cols-7 gap-4 mb-4">
                {/* Product Selection */}
                <select
                  value={item.productId || ''}
                  onChange={(e) => updateItem(item.id, 'productId', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName} (ID: {product.productId})
                    </option>
                  ))}
                </select>
                
                {/* Variation Selection */}
                <select
                  value={item.variationId || ''}
                  onChange={(e) => updateItem(item.id, 'variationId', e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!item.productId || isLoadingVars}
                >
                  <option value="">
                    {isLoadingVars ? 'Loading...' : 
                     !item.productId ? 'Select Product First' : 
                     variations.length === 0 ? 'No Variations' : 'Select Variation'}
                  </option>
                  {variations.map(variation => (
                    <option key={variation.variationId} value={variation.variationId}>
                      {variation.variationName} 
                      {variation.color && ` - ${variation.color}`}
                      {variation.size && ` - ${variation.size}`}
                      {variation.capacity && ` - ${variation.capacity}`}
                    </option>
                  ))}
                </select>
                
                {/* Quantity Received */}
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantityReceived || ''}
                  onChange={(e) => updateItem(item.id, 'quantityReceived', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
                
                {/* Unit Cost */}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Unit Cost"
                  value={item.unitCost || ''}
                  onChange={(e) => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0.01"
                />
                
                {/* Location */}
                <input
                  type="text"
                  placeholder="Location"
                  value={item.location}
                  onChange={(e) => updateItem(item.id, 'location', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Subtotal */}
                <input
                  type="text"
                  value={item.subtotal.toFixed(2)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  disabled
                />

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded-md hover:bg-red-50"
                  disabled={formData.items.length === 1}
                >
                  Remove
                </button>
              </div>
            );
          })}
          
          <div className="text-right mt-4">
            <span className="text-lg font-semibold">
              Total Amount = {getTotalAmount().toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Stock-In'}
          </button>
          <button
            onClick={() => setFormData({
              grnNumber: 'Auto-generated',
              receivedDate: '',
              stockKeeper: currentUser?.UserName || '[User]',
              supplierId: 0,
              remarks: '',
              items: [{
                id: '1',
                productId: 0,
                variationId: null,
                quantityReceived: 0,
                unitCost: 0,
                location: '',
                subtotal: 0
              }]
            })
            
          }
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

  // Stock Out Form Component with Updated Variation Loading
  const StockOutForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState<StockOutFormData>({
      ginNumber: 'Auo-generated',
      issueDate: '',
      issuedTo: '',
      issueReason: '',
      stockKeeper: currentUser?.UserName || '[User]',
      remarks: '',
      items: selectedStock ? [{
        id: '1',
        productId: selectedStock.productId,
        variationId: selectedStock.variationId,
        quantityIssued: 0,
        unitCost: 0,
        location: selectedStock.location || '',
        subtotal: 0
      }] : [{
        id: '1',
        productId: 0,
        variationId: null,
        quantityIssued: 0,
        unitCost: 0,
        location: '',
        subtotal: 0
      }]
    });

    // Add state for managing variations for each item
    const [itemVariations, setItemVariations] = useState<{ [itemId: string]: ProductVariation[] }>({});
    const [loadingVariations, setLoadingVariations] = useState<{ [itemId: string]: boolean }>({});

    const addItem = () => {
      const newItem: StockOutItem = {
        id: Date.now().toString(),
        productId: 0,
        variationId: null,
        quantityIssued: 0,
        unitCost: 0,
        location: '',
        subtotal: 0
      };
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    };

    // Update the updateItem function to handle product changes
    const updateItem = async (id: string, field: keyof StockOutItem, value: any) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item => {
          if (item.id === id) {
            const updatedItem = { ...item, [field]: value };
            
            // If product changed, reset variation and load new variations
            if (field === 'productId' && value !== item.productId) {
              updatedItem.variationId = null;
              
              // Load variations for the new product
              if (value && value > 0) {
                loadVariationsForItem(id, value);
              } else {
                // Clear variations if no product selected
                setItemVariations(prev => ({ ...prev, [id]: [] }));
              }
            }
            
            // Calculate subtotal if quantity or cost changed
            if (field === 'quantityIssued' || field === 'unitCost') {
              updatedItem.subtotal = updatedItem.quantityIssued * updatedItem.unitCost;
            }
            
            return updatedItem;
          }
          return item;
        })
      }));
    };

    // Function to load variations for a specific item
    const loadVariationsForItem = async (itemId: string, productId: number) => {
      try {
        setLoadingVariations(prev => ({ ...prev, [itemId]: true }));
        
        console.log(` Loading variations for item ${itemId}, product ${productId}`);
        
        const variations = await fetchVariationsByProductId(productId);
        
        console.log(` Loaded ${variations.length} variations for item ${itemId}`);
        
        setItemVariations(prev => ({
          ...prev,
          [itemId]: variations
        }));
        
      } catch (error) {
        console.error(` Error loading variations for item ${itemId}:`, error);
        setItemVariations(prev => ({ ...prev, [itemId]: [] }));
      } finally {
        setLoadingVariations(prev => ({ ...prev, [itemId]: false }));
      }
    };

    const removeItem = (id: string) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
      
      // Clean up variations state
      setItemVariations(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      setLoadingVariations(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    };

    // Load initial variations if selectedStock has a product
    useEffect(() => {
      if (selectedStock && selectedStock.productId) {
        const initialItem = formData.items[0];
        if (initialItem) {
          loadVariationsForItem(initialItem.id, selectedStock.productId);
        }
      }
    }, [selectedStock]);

    const getTotalAmount = () => {
      return formData.items.reduce((total, item) => total + item.subtotal, 0);
    };

    const handleSubmit = async () => {
      try {
        setIsSubmitting(true);
        
        // Validate form
        if (!formData.issuedTo || !formData.issueReason || !formData.issueDate) {
          alert('Please fill in all required fields');
          return;
        }

        if (formData.items.length === 0 || formData.items.some(item => 
          !item.productId || !item.quantityIssued || !item.unitCost)) {
          alert('Please add valid items to the stock-out');
          return;
        }

        // Submit stock-out
        await createStockOut({
          stockKeeperId: currentUser!.EmployeeID,
          issuedTo: formData.issuedTo,
          issueReason: formData.issueReason,
          issueDate: formData.issueDate,
          remarks: formData.remarks,
          items: formData.items.map(item => ({
            productId: item.productId,
            variationId: item.variationId || undefined,
            quantityIssued: item.quantityIssued,
            unitCost: item.unitCost,
            location: item.location || undefined
          }))
        });

        alert('Stock-Out saved successfully!');
        await refreshStocks();
        onClose();
      } catch (error) {
        console.error('Stock-out error:', error);
        alert(`Failed to save Stock-Out: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="bg-white p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">Create Stock - Out</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GIN Number</label>
            <input
              type="text"
              value={formData.ginNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, ginNumber: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date *</label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issued To *</label>
            <input
              type="text"
              placeholder="Enter recipient name"
              value={formData.issuedTo}
              onChange={(e) => setFormData(prev => ({ ...prev, issuedTo: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Reason *</label>
            <input
              type="text"
              placeholder="Enter issue reason"
              value={formData.issueReason}
              onChange={(e) => setFormData(prev => ({ ...prev, issueReason: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
        </div>

        {/* Items Table */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Items</h3>
            <button
              onClick={addItem}
              className="text-blue-600 text-sm font-medium hover:text-blue-800"
            >
              + Add Item
            </button>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-4 text-sm font-medium text-gray-500">
            <div>Product *</div>
            <div>Variation</div>
            <div>Quantity Issued *</div>
            <div>Unit Cost *</div>
            <div>Location</div>
            <div>Subtotal</div>
            <div>Actions</div>
          </div>
          
          {formData.items.map((item) => {
            const variations = itemVariations[item.id] || [];
            const isLoadingVars = loadingVariations[item.id] || false;
            
            return (
              <div key={item.id} className="grid grid-cols-7 gap-4 mb-4">
                {/* Product Selection */}
                <select
                  value={item.productId || ''}
                  onChange={(e) => updateItem(item.id, 'productId', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName} (ID: {product.productId})
                    </option>
                  ))}
                </select>
                
                {/* Variation Selection */}
                <select
                  value={item.variationId || ''}
                  onChange={(e) => updateItem(item.id, 'variationId', e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!item.productId || isLoadingVars}
                >
                  <option value="">
                    {isLoadingVars ? 'Loading...' : 
                     !item.productId ? 'Select Product First' : 
                     variations.length === 0 ? 'No Variations' : 'Select Variation'}
                  </option>
                  {variations.map(variation => (
                    <option key={variation.variationId} value={variation.variationId}>
                      {variation.variationName} 
                      {variation.color && ` - ${variation.color}`}
                      {variation.size && ` - ${variation.size}`}
                      {variation.capacity && ` - ${variation.capacity}`}
                    </option>
                  ))}
                </select>
                
                {/* Quantity Issued */}
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantityIssued || ''}
                  onChange={(e) => updateItem(item.id, 'quantityIssued', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
                
                {/* Unit Cost */}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Unit Cost"
                  value={item.unitCost || ''}
                  onChange={(e) => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0.01"
                />
                
                {/* Location */}
                <input
                  type="text"
                  placeholder="Location"
                  value={item.location}
                  onChange={(e) => updateItem(item.id, 'location', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Subtotal */}
                <input
                  type="text"
                  value={item.subtotal.toFixed(2)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  disabled
                />

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded-md hover:bg-red-50"
                  disabled={formData.items.length === 1}
                >
                  Remove
                </button>
              </div>
            );
          })}
          
          <div className="text-right mt-4">
            <span className="text-lg font-semibold">
              Total Amount = {getTotalAmount().toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Stock-Out'}
          </button>
          <button
            onClick={() => setFormData({
              ginNumber: 'Auto-generated',
              issueDate: '',
              issuedTo: '',
              issueReason: '',
              stockKeeper: currentUser?.UserName || '[User]',
              remarks: '',
              items: [{
                id: '1',
                productId: 0,
                variationId: null,
                quantityIssued: 0,
                unitCost: 0,
                location: '',
                subtotal: 0
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
            Only stockkeepers can access stock management.
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
                  <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
                  <p className="mt-2 text-gray-600">
                    Manage inventory stock levels with Stock-In and Stock-Out operations
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleStockInClick()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Create Stock
                  </button>
                  {/* <button
                    onClick={() => handleStockOutClick()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Create Stock Out
                  </button> */}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow">
              <Table
                data={stocks}
                // data={stocks.map(stock => ({
                //   ...stock,
                //   'data-low-stock': (stock.quantityAvailable ?? 0) <= (stock.reorderLevel ?? 0)
                // }))}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No stock records found."
                className="border border-gray-200"
                getRowClassName={getStockRowClassName}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Stock In Form Popup */}
      {isStockInFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseStockInForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                <button
                  onClick={handleCloseStockInForm}
                  className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <StockInForm onClose={handleCloseStockInForm} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Out Form Popup */}
      {isStockOutFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseStockOutForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                <button
                  onClick={handleCloseStockOutForm}
                  className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <StockOutForm onClose={handleCloseStockOutForm} />
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
        title="Delete Stock Record"
        message="Are you sure you want to delete this stock record?"
        warningMessage="This action cannot be undone."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === stockToDelete?.stockId}
        itemName={`Stock ID: ${stockToDelete?.stockId}`}
      />
    </div>
  );
};

export default StockPage;