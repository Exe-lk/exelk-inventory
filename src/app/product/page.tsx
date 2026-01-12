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
import { Product } from '@/types/product';
import { 
  fetchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  createCompleteProduct, 
  CreateCompleteProductRequest,
  clearProductCache,
  clearDropdownCache
} from '@/lib/services/productService';
import { fetchBrands } from '@/lib/services/brandService';
import { fetchCategories } from '@/lib/services/categoryService';
import { fetchModels } from '@/lib/services/modelService';
import { fetchSuppliers } from '@/lib/services/supplierService';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { Brand } from '@/types/brand';
import { Category } from '@/types/category';
import { Model } from '@/types/model';
import { Supplier } from '@/types/supplier';
import { Pencil, Eye, Trash2 } from 'lucide-react';
import { Upload, Download } from 'lucide-react';
import { importProductFromCSV, exportProductToCSV } from '@/lib/services/productService';
import Tooltip from '@/components/Common/Tooltip';


const ProductPage: React.FC = () => {
  const router = useRouter();
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<Employee, 'Password'> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Data states - matching model page pattern
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Form popup states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Helper functions to get names from IDs - matching model page pattern
  const getBrandName = (brandID: number): string => {
    const brand = brands.find(b => b.BrandID === brandID);
    return brand ? brand.BrandName : `Brand ${brandID}`;
  };

  const getCategoryName = (categoryID: number): string => {
    const category = categories.find(c => c.CategoryID === categoryID);
    return category ? category.CategoryName : `Category ${categoryID}`;
  };

  const getModelName = (modelID: number): string => {
    const model = models.find(m => m.ModelID === modelID);
    return model ? model.ModelName : `Model ${modelID}`;
  };

  const getSupplierName = (supplierID: number): string => {
    const supplier = suppliers.find(s => s.SupplierID === supplierID);
    return supplier ? supplier.SupplierName : `Supplier ${supplierID}`;
  };

  // Import form states
  const [isImportFormOpen, setIsImportFormOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    successCount: number;
    errorCount: number;
    errors: string[] | null;
  } | null>(null);

  // Export form states
  const [isExportFormOpen, setIsExportFormOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<{
    exportAll: boolean;
    includeHeaders: boolean;
  }>({
    exportAll: true,
    includeHeaders: true
  });
  const [isExporting, setIsExporting] = useState(false);

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

  // Fetch product data - matching model page pattern exactly
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);


        try {
          const defaultParams = {};
          const cacheKey = `products_cache_${JSON.stringify(defaultParams)}`;
          const cachedProducts = sessionStorage.getItem(cacheKey);
          const cachedBrands = sessionStorage.getItem('brands_cache');
          const cachedCategories = sessionStorage.getItem('categories_cache');
          const cachedModels = sessionStorage.getItem('models_cache');
          const cachedSuppliers = sessionStorage.getItem('suppliers_cache');
          
          // Show cached data immediately if available
          if (cachedProducts) {
            const { data, timestamp } = JSON.parse(cachedProducts);
            if (data) setProducts(data);
          }
          if (cachedBrands) {
            const { data, timestamp } = JSON.parse(cachedBrands);
            if (data) setBrands(data);
          }
          if (cachedCategories) {
            const { data, timestamp } = JSON.parse(cachedCategories);
            if (data) setCategories(data);
          }
          if (cachedModels) {
            const { data, timestamp } = JSON.parse(cachedModels);
            if (data) setModels(data);
          }
          if (cachedSuppliers) {
            const { data, timestamp } = JSON.parse(cachedSuppliers);
            if (data) setSuppliers(data);
          }
        } catch (cacheError) {
          console.warn('Cache read error:', cacheError);
        }
        
        // Load all required data in parallel
        const [productsData, brandsData, categoriesData, modelsData, suppliersData] = await Promise.all([
          fetchProducts(),
          fetchBrands(),
          fetchCategories(),
          fetchModels(),
          fetchSuppliers()
        ]);
        
        setProducts(productsData);
        setBrands(brandsData);
        setCategories(categoriesData);
        setModels(modelsData);
        setSuppliers(suppliersData);
        
        console.log('Loaded data:', {
          products: productsData.length,
          brands: brandsData.length,
          categories: categoriesData.length,
          models: modelsData.length,
          suppliers: suppliersData.length
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
      alert('Access denied. Only stockkeepers can access product management.');
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

  // Navigation handler for Product Versions
  const handleViewProductVersions = () => {
    router.push('/productversion');
  };

  // Handle product deletion - matching model page pattern
  const handleDeleteProduct = async (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
  
    try {
      setIsDeleting(productToDelete.productId);
      await deleteProduct(productToDelete.productId);
      
      // Clear product cache after deletion
      const { clearProductCache } = await import('@/lib/services/productService');
      clearProductCache();
      
      // Refresh data
      await refreshData();
      
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      
      alert('Product deleted successfully!');
      console.log('Product deleted successfully');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    console.log('Edit product:', product);
    setSelectedProduct(product);
    setIsUpdateFormOpen(true);
  };

  // Handle create complete product form submission
  const handleCreateCompleteProduct = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      console.log('Creating complete product with data:', formData);
      
      // Parse specs from the form data
      const specs = [];
      let specIndex = 0;

      while (formData[`spec_${specIndex}_name`]) {
        const specName = formData[`spec_${specIndex}_name`];
        const specValue = formData[`spec_${specIndex}_value`];
        
        if (specName && specValue) {
          specs.push({
            specName: specName,
            specValue: specValue
          });
        }
        specIndex++;
      }

      const completeProductData: CreateCompleteProductRequest = {
        product: {
          sku: formData.sku,
          productName: formData.productName,
          description: formData.description,
          categoryId: parseInt(formData.categoryId),
          brandId: parseInt(formData.brandId),
          modelId: parseInt(formData.modelId),
          supplierId: parseInt(formData.supplierId),
          isActive: formData.isActive !== undefined ? formData.isActive : true
        },
        productVersion: {
          versionNumber: formData.versionNumber,
          releaseDate: formData.releaseDate,
          isActive: formData.versionIsActive !== undefined ? formData.versionIsActive : true
        },
        productVariation: {
          variationName: formData.variationName,
          color: formData.color || '',
          size: formData.size || '',
          capacity: formData.capacity || '',
          barcode: formData.barcode || '',
          price: parseFloat(formData.price) || 0,
          quantity: parseInt(formData.quantity) || 0,
          minStockLevel: parseInt(formData.minStockLevel) || 0,
          maxStockLevel: parseInt(formData.maxStockLevel) || 0,
          isActive: formData.variationIsActive !== undefined ? formData.variationIsActive : true
        },
        specs: specs
      };
      
      const result = await createCompleteProduct(completeProductData);
      
      const { clearProductCache } = await import('@/lib/services/productService');
      clearProductCache();
    
      // Refresh data
      await refreshData();
      
      setIsCreateFormOpen(false);
      alert(`Complete product created successfully! 
      Product ID: ${result?.product?.productId}
      Version ID: ${result?.productVersion?.versionId}
      Variation ID: ${result?.productVariation?.variationId}
      Specs Created: ${result?.specs?.length || 0}
      Spec Details Created: ${result?.specDetails?.length || 0}`);
      
    } catch (err) {
      console.error('Error creating complete product:', err);
      alert('Failed to create complete product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update product form submission
  const handleUpdateProduct = async (formData: Record<string, any>) => {
    if (!selectedProduct) return;
    
    try {
      setIsSubmitting(true);
      
      console.log('Updating product with data:', formData);
      
      const updateData = {
        sku: formData.sku,
        productName: formData.productName,
        description: formData.description,
        categoryId: parseInt(formData.categoryId),
        brandId: parseInt(formData.brandId),
        modelId: parseInt(formData.modelId),
        supplierId: parseInt(formData.supplierId),
        isActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const updatedProduct = await updateProduct(selectedProduct.productId, updateData);
      // Clear product cache after update
      const { clearProductCache } = await import('@/lib/services/productService');
      clearProductCache();
      
      // Refresh data
      await refreshData();
      
      setIsUpdateFormOpen(false);
      setSelectedProduct(null);
      alert('Product updated successfully!');
      
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


    // Import handlers
  const handleImportClick = () => {
    setIsImportFormOpen(true);
    setSelectedFile(null);
    setImportResult(null);
  };

  const handleCloseImportForm = () => {
    if (isImporting) return;
    setIsImportFormOpen(false);
    setSelectedFile(null);
    setImportResult(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) {
      alert('Please select a CSV file');
      return;
    }

    try {
      setIsImporting(true);
      setImportResult(null);

      const result = await importProductFromCSV(selectedFile);
      setImportResult(result);

      if (result.errorCount === 0) {
        alert(`Successfully imported ${result.successCount} products!`);
        await refreshData();
        setTimeout(() => {
          handleCloseImportForm();
        }, 2000);
      } else {
        alert(`Import completed with ${result.errorCount} errors. ${result.successCount} products imported successfully.`);
        await refreshData();
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Failed to import products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Export handlers
  const handleExportClick = () => {
    setIsExportFormOpen(true);
    setExportOptions({
      exportAll: true,
      includeHeaders: true
    });
  };

  const handleCloseExportForm = () => {
    if (isExporting) return;
    setIsExportFormOpen(false);
  };

  const handleExportSubmit = async () => {
    try {
      setIsExporting(true);

      let productsToExport: Product[] = [];

      if (exportOptions.exportAll) {
        // Fetch all products
        const allProductsData = await fetchProducts({
          page: 1,
          limit: 10000
        });
        productsToExport = allProductsData;
      } else {
        // Export only currently displayed products
        productsToExport = products;
      }

      if (productsToExport.length === 0) {
        alert('No products found to export');
        return;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `product_export_${timestamp}.csv`;

      // Export to CSV
      await exportProductToCSV(productsToExport, filename);

      alert(`Successfully exported ${productsToExport.length} products!`);
      
      setTimeout(() => {
        handleCloseExportForm();
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Define comprehensive form fields for product creation with dynamic specs
  const getFormFields = (): FormField[] => [
    // Product Information
    {
      name: 'sku',
      label: 'SKU',
      type: 'text',
      placeholder: 'Enter SKU',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'SKU must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'productName',
      label: 'Product Name',
      type: 'text',
      placeholder: 'Enter product name',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'Product name must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter product description',
      required: true,
      rows: 3
    },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'select',
      placeholder: 'Select category',
      required: true,
      options: categories
        .filter(category => category.IsActive)
        .map(category => ({
          label: category.CategoryName,
          value: category.CategoryID
        }))
    },
    {
      name: 'brandId',
      label: 'Brand',
      type: 'select',
      placeholder: 'Select brand',
      required: true,
      options: brands
        .filter(brand => brand.IsActive)
        .map(brand => ({
          label: brand.BrandName,
          value: brand.BrandID
        }))
    },
    {
      name: 'modelId',
      label: 'Model',
      type: 'select',
      placeholder: 'Select model',
      required: true,
      options: models
        .filter(model => model.IsActive)
        .map(model => ({
          label: model.ModelName,
          value: model.ModelID
        }))
    },
    {
      name: 'supplierId',
      label: 'Supplier',
      type: 'select',
      placeholder: 'Select supplier',
      required: true,
      options: suppliers
        .filter(supplier => supplier.IsActive)
        .map(supplier => ({
          label: supplier.SupplierName,
          value: supplier.SupplierID
        }))
    },
    {
      name: 'isActive',
      label: 'Product Active Status',
      type: 'checkbox',
      required: false,
      defaultValue: true
    },
    
    // Product Version Information
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
      name: 'versionIsActive',
      label: 'Version Active Status',
      type: 'checkbox',
      required: false,
      defaultValue: true
    },
    
    // Product Variation Information
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
      name: 'variationIsActive',
      label: 'Variation Active Status',
      type: 'checkbox',
      required: false,
      defaultValue: true
    }
  ];

  // Define simple form fields for product editing - matching model page pattern exactly
  const getSimpleFormFields = (): FormField[] => [
    {
      name: 'sku',
      label: 'SKU',
      type: 'text',
      placeholder: 'Enter SKU',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'SKU must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'productName',
      label: 'Product Name',
      type: 'text',
      placeholder: 'Enter product name',
      required: true,
      validation: (value: string) => {
        if (value && value.length < 2) {
          return 'Product name must be at least 2 characters long';
        }
        return null;
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter product description',
      required: true,
      rows: 3
    },
    {
      name: 'categoryId',
      label: 'Category',
      type: 'select',
      placeholder: 'Select category',
      required: true,
      options: categories
        .filter(category => category.IsActive)
        .map(category => ({
          label: category.CategoryName,
          value: category.CategoryID
        }))
    },
    {
      name: 'brandId',
      label: 'Brand',
      type: 'select',
      placeholder: 'Select brand',
      required: true,
      options: brands
        .filter(brand => brand.IsActive)
        .map(brand => ({
          label: brand.BrandName,
          value: brand.BrandID
        }))
    },
    {
      name: 'modelId',
      label: 'Model',
      type: 'select',
      placeholder: 'Select model',
      required: true,
      options: models
        .filter(model => model.IsActive)
        .map(model => ({
          label: model.ModelName,
          value: model.ModelID
        }))
    },
    {
      name: 'supplierId',
      label: 'Supplier',
      type: 'select',
      placeholder: 'Select supplier',
      required: true,
      options: suppliers
        .filter(supplier => supplier.IsActive)
        .map(supplier => ({
          label: supplier.SupplierName,
          value: supplier.SupplierID
        }))
    },
    {
      name: 'isActive',
      label: 'Active Status',
      type: 'checkbox',
      required: false
    }
  ];

  // Define table columns - matching model page pattern
  const columns: TableColumn[] = [
    {
      key: 'productId',
      label: 'ID',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {String(value).padStart(4, '0')}
        </span>
      )
    },
    {
      key: 'productName',
      label: 'Product Name',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      filterable: false,
      render: (value: string) => (
        <span className="text-gray-600">
          {value.length > 30 ? `${value.substring(0, 30)}...` : value}
        </span>
      )
    },
    {
      key: 'categoryId',
      label: 'Category',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {getCategoryName(value)}
        </span>
      )
    },
    {
      key: 'brandId',
      label: 'Brand',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {getBrandName(value)}
        </span>
      )
    },
    {
      key: 'modelId',
      label: 'Model',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {getModelName(value)}
        </span>
      )
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {getSupplierName(value)}
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
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
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

  // Define action buttons for stockkeepers only - matching model page pattern
  const getActions = (): ActionButton[] => {
    if (!isStockKeeper(currentUser?.RoleID || 0)) {
      return [];
    }
    
    return [
      {
        label: (
                <span className="flex items-center gap-2">
                  <Pencil size={16} />
                  
                </span>
              ),
        onClick: (product: Product) => {
          handleEditProduct(product);
        },
        variant: 'primary'
      },
      {
        label: (
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  
                </span>
              ),
        onClick: (product: Product) => {
          if (isDeleting === product.productId) {
            return;
          }
          handleDeleteProduct(product);
        },
        variant: 'danger'
      }
    ];
  };

  const actions = getActions();

  // Form handlers
  const handleCreateClick = () => {
    console.log('Create product clicked');
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false);
  };

  const handleCloseUpdateForm = () => {
    setIsUpdateFormOpen(false);
    setSelectedProduct(null);
  };

  // Refresh data - matching model page pattern
  const refreshData = async () => {
    try {
      setLoading(true);

      const { clearProductCache } = await import('@/lib/services/productService');
      clearProductCache();
    
      const [productsData, brandsData, categoriesData, modelsData, suppliersData] = await Promise.all([
        fetchProducts({ page: 1, limit: 50 }),
        fetchBrands(),
        fetchCategories(),
        fetchModels(),
        fetchSuppliers()
      ]);
      
      setProducts(productsData);
      setBrands(brandsData);
      setCategories(categoriesData);
      setModels(modelsData);
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
            Only stockkeepers can access product management.
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
                  <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                  <p className="mt-2 text-gray-600">
                    Create complete products with versions, variations, and specifications
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                <Tooltip content="Import product data from CSV file" position="bottom">
                  <button
                    onClick={handleImportClick}
                     title="Import stock data from CSV file"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Upload size={20} className="mr-2" />
                    
                  </button>
                </Tooltip>
                <Tooltip content="Export product data to CSV file" position="bottom">
                  <button
                    onClick={handleExportClick}
                    title="Export stock data to CSV file"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Download size={20} className="mr-2" />
                   
                  </button>
                </Tooltip>
                  <button
                    onClick={handleViewProductVersions}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    View Product Versions
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table
                data={products}
                columns={columns}
                actions={actions}
                itemsPerPage={10}
                searchable={true}
                filterable={true}
                loading={loading}
                emptyMessage="No products found. Create your first complete product to get started."
                onCreateClick={isStockKeeper(currentUser?.RoleID || 0) ? handleCreateClick : undefined}
                createButtonLabel="Create Product"
                className="border border-gray-200"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Create Complete Product Form Popup */}
      {isCreateFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseCreateForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  fields={getFormFields()}
                  onSubmit={handleCreateCompleteProduct}
                  onClear={() => {}}
                  title="Create Product"
                  submitButtonLabel="Create Product"
                  clearButtonLabel="Clear"
                  loading={isSubmitting}
                  enableDynamicSpecs={true}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Product Form Popup */}
      {isUpdateFormOpen && selectedProduct && (
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
                  fields={getSimpleFormFields()}
                  onSubmit={handleUpdateProduct}
                  title="Update Product"
                  //updateButtonLabel="Update Category"
                  loading={isSubmitting}
                  initialData={{
                    sku: selectedProduct.sku,
                    productName: selectedProduct.productName,
                    description: selectedProduct.description,
                    categoryId: selectedProduct.categoryId.toString(),
                    brandId: selectedProduct.brandId.toString(),
                    modelId: selectedProduct.modelId.toString(),
                    supplierId: selectedProduct.supplierId.toString(),
                    isActive: selectedProduct.isActive
                  }}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Import Form Popup */}
      {isImportFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseImportForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                <button
                  onClick={handleCloseImportForm}
                  disabled={isImporting}
                  className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="bg-white p-8 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700">Import Products from CSV</h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Upload a CSV file to bulk import product records
                    </p>
                  </div>

                  {/* CSV Format Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">CSV Format Requirements:</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li><strong>Required columns:</strong> sku, productName, categoryId, brandId, modelId, supplierId</li>
                      <li><strong>Optional columns:</strong> productId (for updates), description, isActive</li>
                      <li>First row must contain column headers</li>
                      <li>File size limit: 10MB</li>
                    </ul>
                    <div className="mt-3 text-xs text-blue-700">
                      <strong>Example:</strong>
                      <pre className="mt-1 bg-white p-2 rounded border">
                          {`sku,productName,description,categoryId,brandId,modelId,supplierId,isActive
                          LAP001,MacBook Pro,High-performance laptop,1,1,1,1,true
                          LAP002,MacBook Air,Lightweight laptop,1,1,2,1,true`}
                      </pre>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select CSV File *
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={isImporting}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {selectedFile && (
                      <div className="mt-2 text-sm text-gray-600">
                        Selected: <span className="font-medium">{selectedFile.name}</span> 
                        ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </div>
                    )}
                  </div>

                  {/* Import Results */}
                  {importResult && (
                    <div className={`mb-6 p-4 rounded-lg ${
                      importResult.errorCount === 0 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <h3 className="font-semibold mb-2">
                        {importResult.errorCount === 0 ? '✅ Import Successful' : '⚠️ Import Completed with Errors'}
                      </h3>
                      <div className="text-sm space-y-1">
                        <div>Total Rows: {importResult.totalRows}</div>
                        <div className="text-green-700">Successful: {importResult.successCount}</div>
                        {importResult.errorCount > 0 && (
                          <div className="text-red-700">Errors: {importResult.errorCount}</div>
                        )}
                      </div>
                      
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-3 max-h-40 overflow-y-auto">
                          <h4 className="font-medium text-sm mb-1">Error Details:</h4>
                          <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                            {importResult.errors.slice(0, 10).map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                            {importResult.errors.length > 10 && (
                              <li>... and {importResult.errors.length - 10} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={handleImportSubmit}
                      disabled={!selectedFile || isImporting}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isImporting ? 'Importing...' : 'Import Products'}
                    </button>
                    <button
                      onClick={handleCloseImportForm}
                      disabled={isImporting}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                    >
                      {importResult ? 'Close' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Form Popup */}
      {isExportFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCloseExportForm}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="relative bg-white rounded-lg shadow-xl">
                <button
                  onClick={handleCloseExportForm}
                  disabled={isExporting}
                  className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="bg-white p-8 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700">Export Products to CSV</h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Export product records to a CSV file for external use
                    </p>
                  </div>

                  {/* Export Options */}
                  <div className="space-y-6 mb-6">
                    {/* Export Scope */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Export Scope</h3>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="exportScope"
                            checked={exportOptions.exportAll}
                            onChange={() => setExportOptions(prev => ({ ...prev, exportAll: true }))}
                            disabled={isExporting}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Export all products</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="exportScope"
                            checked={!exportOptions.exportAll}
                            onChange={() => setExportOptions(prev => ({ ...prev, exportAll: false }))}
                            disabled={isExporting}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Export currently displayed products only ({products.length} records)</span>
                        </label>
                      </div>
                    </div>

                    {/* Export Preview */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Export Preview</h3>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>Records to export: <strong>{exportOptions.exportAll ? 'All products' : products.length}</strong></div>
                        <div>File format: <strong>CSV (Comma-separated values)</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={handleExportSubmit}
                      disabled={isExporting}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? 'Exporting...' : 'Export to CSV'}
                    </button>
                    <button
                      onClick={handleCloseExportForm}
                      disabled={isExporting}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
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
        title="Delete a Product"
        message="Are you sure you want to delete this product?"
        warningMessage="By deleting this product, all related data will be affected."
        confirmButtonText="Yes, Delete"
        cancelButtonText="No, Cancel"
        loading={isDeleting === productToDelete?.productId}
        itemName={productToDelete?.productName}
      />
    </div>
  );
};

export default ProductPage;