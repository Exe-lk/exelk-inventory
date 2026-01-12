import { prisma } from '@/lib/prisma/client'
import { BinCard, BinCardWithDetails, BinCardComplete, CreateBinCardRequest, BinCardQueryParams, BinCardDBWithRelations, BinCardValidationResult, BinCardValidationError } from '@/types/bincard'

export class BinCardService {
  
  /**
   * Get all bin cards with pagination, sorting, search and filtering
   */
  static async getAllBinCards(params: BinCardQueryParams) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
      search = '',
      variationId,
      transactionType,
      stockKeeperId
    } = params

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build where conditions
    const where: any = {}

    // Apply filters
    if (variationId) {
      where.variationId = variationId
    }

    if (transactionType && ['GRN', 'GIN'].includes(transactionType)) {
      where.transactionType = transactionType
    }

    if (stockKeeperId) {
      where.employeeId = stockKeeperId
    }

    // Search filter - search in remarks and transaction type
    if (search) {
      where.OR = [
        { remarks: { contains: search, mode: 'insensitive' } },
        { transactionType: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Valid sort columns
    const validSortColumns = [
      'bincardId', 'variationId', 'transactionDate', 'transactionType', 
      'referenceId', 'quantityIn', 'quantityOut', 'balance', 'employeeId'
    ]
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'transactionDate'
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc'

    try {
      // Get bin cards with counts
      const [binCards, totalCount] = await Promise.all([
        prisma.bincard.findMany({
          where,
          orderBy: {
            [sortColumn]: sortDirection
          },
          skip: offset,
          take: limit,
          include: {
            productvariation: {
              select: {
                variationName: true,
                color: true,
                size: true,
                capacity: true,
                version: {
                  select: {
                    product: {
                      select: {
                        productName: true,
                        sku: true,
                        brand: {
                          select: {
                            brandName: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            employees: {
              select: {
                UserName: true,
                Email: true
              }
            }
          }
        }),
        prisma.bincard.count({ where })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      // Transform data
      const transformedBinCards: BinCardWithDetails[] = binCards.map(binCard => ({
        binCardId: binCard.bincardId,
        variationId: binCard.variationId,
        transactionDate: binCard.transactionDate?.toISOString().split('T')[0] || '',
        transactionType: (binCard.transactionType as 'GRN' | 'GIN') || 'GRN',
        referenceId: binCard.referenceId,
        quantityIn: binCard.quantityIn || 0,
        quantityOut: binCard.quantityOut || 0,
        balance: binCard.balance || 0,
        stockKeeperId: binCard.employeeId,
        remarks: binCard.remarks,
        // Include related data
        variationName: binCard.productvariation?.variationName,
        variationColor: binCard.productvariation?.color,
        variationSize: binCard.productvariation?.size,
        variationCapacity: binCard.productvariation?.capacity,
        productName: binCard.productvariation?.version?.product?.productName,
        productSku: binCard.productvariation?.version?.product?.sku,
        brandName: binCard.productvariation?.version?.product?.brand?.brandName,
        stockKeeperName: binCard.employees?.UserName,
        stockKeeperEmail: binCard.employees?.Email
      }))

      return {
        items: transformedBinCards,
        pagination: {
          totalItems: totalCount,
          page,
          limit,
          totalPages
        },
        sorting: {
          sortBy: sortColumn,
          sortOrder: sortDirection
        },
        search: search || null,
        filters: {
          variationId: variationId || null,
          transactionType: transactionType || null,
          stockKeeperId: stockKeeperId || null
        }
      }

    } catch (error) {
      console.error('Error fetching bin cards:', error)
      throw new Error(`Failed to fetch bin cards: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get single bin card by ID with all details
   */
  static async getBinCardById(binCardId: number): Promise<BinCardComplete> {
    try {
      const binCard = await prisma.bincard.findUnique({
        where: { bincardId: binCardId },
        include: {
          productvariation: {
            select: {
              variationId: true,
              variationName: true,
              color: true,
              size: true,
              capacity: true,
              barcode: true,
              price: true,
              quantity: true,
              minStockLevel: true,
              maxStockLevel: true,
              version: {
                select: {
                  versionId: true,
                  versionNumber: true,
                  releaseDate: true,
                  product: {
                    select: {
                      productId: true,
                      productName: true,
                      sku: true,
                      description: true,
                      brand: {
                        select: {
                          brandId: true,
                          brandName: true,
                          country: true
                        }
                      },
                      category: {
                        select: {
                          categoryId: true,
                          categoryName: true,
                          mainCategory: true
                        }
                      },
                      model: {
                        select: {
                          modelId: true,
                          modelName: true,
                          description: true
                        }
                      },
                      supplier: {
                        select: {
                          supplierId: true,
                          supplierName: true,
                          contactPerson: true,
                          email: true,
                          phone: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          employees: {
            select: {
              EmployeeID: true,
              UserName: true,
              Email: true,
              Phone: true
            }
          }
        }
      }) as BinCardDBWithRelations | null

      if (!binCard) {
        throw new Error('Bin card not found')
      }

      // Transform to complete bin card
      const transformedBinCard: BinCardComplete = {
        binCardId: binCard.bincardId,
        variationId: binCard.variationId,
        transactionDate: binCard.transactionDate?.toISOString().split('T')[0] || '',
        transactionType: (binCard.transactionType as 'GRN' | 'GIN') || 'GRN',
        referenceId: binCard.referenceId,
        quantityIn: binCard.quantityIn || 0,
        quantityOut: binCard.quantityOut || 0,
        balance: binCard.balance || 0,
        stockKeeperId: binCard.employeeId,
        remarks: binCard.remarks,
        
        // Stock keeper details
        stockKeeper: {
          id: binCard.employees?.EmployeeID || 0,
          name: binCard.employees?.UserName || '',
          email: binCard.employees?.Email || '',
          phone: binCard.employees?.Phone || null
        },
        
        // Product variation details
        variation: {
          id: binCard.productvariation?.variationId || 0,
          name: binCard.productvariation?.variationName || null,
          color: binCard.productvariation?.color || null,
          size: binCard.productvariation?.size || null,
          capacity: binCard.productvariation?.capacity || null,
          barcode: binCard.productvariation?.barcode || null,
          price: binCard.productvariation?.price ? parseFloat(binCard.productvariation.price.toString()) : null,
          quantity: binCard.productvariation?.quantity || null,
          minStockLevel: binCard.productvariation?.minStockLevel || null,
          maxStockLevel: binCard.productvariation?.maxStockLevel || null
        },
        
        // Product version details
        version: {
          id: binCard.productvariation?.version?.versionId || 0,
          number: binCard.productvariation?.version?.versionNumber || null,
          releaseDate: binCard.productvariation?.version?.releaseDate?.toISOString().split('T')[0] || null
        },
        
        // Product details
        product: {
          id: binCard.productvariation?.version?.product?.productId || 0,
          name: binCard.productvariation?.version?.product?.productName || null,
          sku: binCard.productvariation?.version?.product?.sku || null,
          description: binCard.productvariation?.version?.product?.description || null,
          
          // Brand details
          brand: {
            id: binCard.productvariation?.version?.product?.brand?.brandId || 0,
            name: binCard.productvariation?.version?.product?.brand?.brandName || null,
            country: binCard.productvariation?.version?.product?.brand?.country || null
          },
          
          // Category details
          category: {
            id: binCard.productvariation?.version?.product?.category?.categoryId || 0,
            name: binCard.productvariation?.version?.product?.category?.categoryName || null,
            mainCategory: binCard.productvariation?.version?.product?.category?.mainCategory || null
          },
          
          // Model details
          model: {
            id: binCard.productvariation?.version?.product?.model?.modelId || 0,
            name: binCard.productvariation?.version?.product?.model?.modelName || null,
            description: binCard.productvariation?.version?.product?.model?.description || null
          },
          
          // Supplier details
          supplier: {
            id: binCard.productvariation?.version?.product?.supplier?.supplierId || 0,
            name: binCard.productvariation?.version?.product?.supplier?.supplierName || null,
            contactPerson: binCard.productvariation?.version?.product?.supplier?.contactPerson || null,
            email: binCard.productvariation?.version?.product?.supplier?.email || null,
            phone: binCard.productvariation?.version?.product?.supplier?.phone || null
          }
        }
      }

      return transformedBinCard

    } catch (error) {
      console.error(`Error fetching bin card ${binCardId}:`, error)
      throw error instanceof Error ? error : new Error('Failed to fetch bin card')
    }
  }

  /**
   * Create new bin card entry
   */
  // static async createBinCard(data: CreateBinCardRequest): Promise<BinCard> {
  //   // Validate input
  //   const validation = this.validateCreateBinCardRequest(data)
  //   if (!validation.isValid) {
  //     throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
  //   }

  //   try {
  //     const result = await prisma.$transaction(async (tx) => {
  //       // Verify variation exists
  //       const variation = await tx.productvariation.findUnique({
  //         where: { variationId: data.variationId }
  //       });

  //       if (!variation) {
  //         throw new Error(`Product variation with ID ${data.variationId} not found`);
  //       }

  //       // Verify employee exists
  //       const employee = await tx.employees.findUnique({
  //         where: { EmployeeID: data.stockKeeperId }
  //       });

  //       if (!employee) {
  //         throw new Error(`Employee with ID ${data.stockKeeperId} not found`);
  //       }

  //       // Create bin card entry
  //       const binCard = await tx.bincard.create({
  //         data: {
  //           variationId: data.variationId,
  //           transactionDate: new Date(data.transactionDate),
  //           transactionType: data.transactionType,
  //           referenceId: data.referenceId || null,
  //           quantityIn: data.quantityIn || null,
  //           quantityOut: data.quantityOut || null,
  //           balance: data.balance,
  //           employeeId: data.stockKeeperId,
  //           remarks: data.remarks || null
  //         }
  //       })

  //       return binCard
  //     })

  //     // Transform to response format
  //     const transformedBinCard: BinCard = {
  //       binCardId: result.bincardId,
  //       variationId: result.variationId,
  //       transactionDate: result.transactionDate?.toISOString().split('T')[0] || '',
  //       transactionType: (result.transactionType as 'GRN' | 'GIN') || 'GRN',
  //       referenceId: result.referenceId,
  //       quantityIn: result.quantityIn || 0,
  //       quantityOut: result.quantityOut || 0,
  //       balance: result.balance || 0,
  //       stockKeeperId: result.employeeId,
  //       remarks: result.remarks
  //     }

  //     return transformedBinCard

  //   } catch (error) {
  //     console.error('Error creating bin card:', error)
  //     throw error instanceof Error ? error : new Error('Failed to create bin card')
  //   }
  // }

  /**
   * Get bin cards by variation ID
   */
  static async getBinCardsByVariationId(variationId: number, limit = 50): Promise<BinCardWithDetails[]> {
    try {
      const binCards = await prisma.bincard.findMany({
        where: { variationId },
        orderBy: { transactionDate: 'desc' },
        take: limit,
        include: {
          productvariation: {
            select: {
              variationName: true,
              color: true,
              size: true,
              capacity: true,
              version: {
                select: {
                  product: {
                    select: {
                      productName: true,
                      sku: true,
                      brand: {
                        select: {
                          brandName: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          employees: {
            select: {
              UserName: true,
              Email: true
            }
          }
        }
      })

      return binCards.map(binCard => ({
        binCardId: binCard.bincardId,
        variationId: binCard.variationId,
        transactionDate: binCard.transactionDate?.toISOString().split('T')[0] || '',
        transactionType: (binCard.transactionType as 'GRN' | 'GIN') || 'GRN',
        referenceId: binCard.referenceId,
        quantityIn: binCard.quantityIn || 0,
        quantityOut: binCard.quantityOut || 0,
        balance: binCard.balance || 0,
        stockKeeperId: binCard.employeeId,
        remarks: binCard.remarks,
        variationName: binCard.productvariation?.variationName,
        variationColor: binCard.productvariation?.color,
        variationSize: binCard.productvariation?.size,
        variationCapacity: binCard.productvariation?.capacity,
        productName: binCard.productvariation?.version?.product?.productName,
        productSku: binCard.productvariation?.version?.product?.sku,
        brandName: binCard.productvariation?.version?.product?.brand?.brandName,
        stockKeeperName: binCard.employees?.UserName,
        stockKeeperEmail: binCard.employees?.Email
      }))

    } catch (error) {
      console.error(`Error fetching bin cards for variation ${variationId}:`, error)
      throw new Error('Failed to fetch bin cards by variation ID')
    }
  }

  /**
   * Get current balance for a variation
   */
  static async getCurrentBalance(variationId: number): Promise<number> {
    try {
      const latestEntry = await prisma.bincard.findFirst({
        where: { variationId },
        orderBy: { transactionDate: 'desc' },
        select: { balance: true }
      })

      return latestEntry?.balance || 0

    } catch (error) {
      console.error(`Error fetching current balance for variation ${variationId}:`, error)
      return 0
    }
  }

  /**
   * Validate create bin card request
   */
  private static validateCreateBinCardRequest(data: CreateBinCardRequest): BinCardValidationResult {
    const errors: BinCardValidationError[] = []

    if (!data.variationId || data.variationId <= 0) {
      errors.push({ field: 'variationId', message: 'Valid variation ID is required' })
    }

    if (!data.transactionDate) {
      errors.push({ field: 'transactionDate', message: 'Transaction date is required' })
    } else {
      const date = new Date(data.transactionDate)
      if (isNaN(date.getTime())) {
        errors.push({ field: 'transactionDate', message: 'Invalid transaction date format' })
      }
    }

    if (!data.transactionType || !['GRN', 'GIN'].includes(data.transactionType)) {
      errors.push({ field: 'transactionType', message: 'Transaction type must be either GRN or GIN' })
    }

    if (data.balance === undefined || data.balance === null || data.balance < 0) {
      errors.push({ field: 'balance', message: 'Balance is required and must be non-negative' })
    }

    if (!data.stockKeeperId || data.stockKeeperId <= 0) {
      errors.push({ field: 'stockKeeperId', message: 'Valid stock keeper ID is required' })
    }

    if (data.quantityIn && data.quantityIn < 0) {
      errors.push({ field: 'quantityIn', message: 'Quantity in must be non-negative' })
    }

    if (data.quantityOut && data.quantityOut < 0) {
      errors.push({ field: 'quantityOut', message: 'Quantity out must be non-negative' })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}




export async function exportBinCardsToCSV(
  binCards: BinCardWithDetails[], 
  filename?: string
): Promise<void> {
  try {
    console.log(' Exporting bin cards to CSV:', binCards.length, 'records');

    // Define CSV headers based on your table columns
    const headers = [
      'Bin Card ID',
      'Transaction Date',
      'Transaction Type',
      'Variation ID',
      'Product Name',
      'Product SKU',
      'Brand Name',
      'Variation Name',
      'Variation Color',
      'Variation Size',
      'Variation Capacity',
      'GRN/GIN Ref ID',
      'Quantity In',
      'Quantity Out',
      'Balance',
      'Stock Keeper Name',
      'Stock Keeper ID',
      'Stock Keeper Email',
      'Remarks'
    ];

    // Convert bin card data to CSV rows
    const csvRows = binCards.map(binCard => {
      // Format transaction date
      const transactionDate = binCard.transactionDate 
        ? new Date(binCard.transactionDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        : '';

      return [
        binCard.binCardId?.toString() || '',
        transactionDate,
        binCard.transactionType || '',
        binCard.variationId?.toString() || '',
        binCard.productName || 'N/A',
        binCard.productSku || 'N/A',
        binCard.brandName || 'N/A',
        binCard.variationName || 'N/A',
        binCard.variationColor || 'N/A',
        binCard.variationSize || 'N/A',
        binCard.variationCapacity || 'N/A',
        binCard.referenceId?.toString() || 'N/A',
        binCard.quantityIn?.toString() || '0',
        binCard.quantityOut?.toString() || '0',
        binCard.balance?.toString() || '0',
        binCard.stockKeeperName || 'Unknown',
        binCard.stockKeeperId?.toString() || '',
        binCard.stockKeeperEmail || 'N/A',
        binCard.remarks || ''
      ].map(field => {
        // Escape fields that contain commas, quotes, or newlines
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const finalFilename = filename || `bincard_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);

    // Track export in database (optional but recommended)
    try {
      await fetch('/api/bincard/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fileName: finalFilename,
          recordCount: binCards.length,
          remarks: `Bin card export - ${binCards.length} records`
        })
      });
      console.log(' Export tracked in database');
    } catch (trackingError) {
      console.error(' Failed to track export (non-critical):', trackingError);
      // Don't throw - export was successful, tracking is just for audit
    }

    console.log(' Bin cards exported successfully');
  } catch (error) {
    console.error(' Error exporting bin cards:', error);
    throw new Error('Failed to export bin cards to CSV');
  }
}




// Add at the top after imports
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for bincard list
const BINCARD_DETAILS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for single bincard details

// Add these new functions after the exportBinCardsToCSV function

// Fetch bin cards with caching
export async function fetchBinCards(params: BinCardQueryParams = {}): Promise<{
  items: BinCardWithDetails[];
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
  search: string | null;
  filters: {
    variationId: number | null;
    transactionType: string | null;
    stockKeeperId: number | null;
  };
}> {
  // Create cache key based on query params
  const cacheKey = `bincards_cache_${JSON.stringify(params)}`;
  
  // Check for cached data
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log(' Using cached bincards data');
        return data;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn(' Failed to read bincards cache:', error);
  }
  
  try {
    console.log(' Fetching bincards');
    
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.search) queryParams.set('search', params.search);
    if (params.variationId) queryParams.set('variationId', params.variationId.toString());
    if (params.transactionType) queryParams.set('transactionType', params.transactionType);
    if (params.stockKeeperId) queryParams.set('stockKeeperId', params.stockKeeperId.toString());

    const url = queryParams.toString() ? `/api/bincard?${queryParams}` : '/api/bincard';
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch bincards error response:', errorData);
      
      // Try stale cache on error
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log(' Using stale cache due to fetch error');
          return data;
        }
      } catch (fallbackError) {
        // Ignore
      }
      
      throw new Error(errorData.message || 'Failed to fetch bin cards');
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      // Cache the successful response
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: result.data,
          timestamp: Date.now()
        }));
        console.log(' Bincards data cached successfully');
      } catch (cacheError) {
        console.warn(' Failed to cache bincards data:', cacheError);
      }
      
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching bincards:', error);
    
    // Try stale cache on error
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log(' Using stale cache due to fetch error');
        return data;
      }
    } catch (fallbackError) {
      // Ignore
    }
    
    throw error;
  }
}

// Fetch bin card by ID with caching
export async function fetchBinCardById(binCardId: number): Promise<any> {
  const cacheKey = `bincard_details_cache_${binCardId}`;
  
  // Check for cached data
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < BINCARD_DETAILS_CACHE_DURATION) {
        console.log(' Using cached bincard details');
        return data;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn(' Failed to read bincard details cache:', error);
  }
  
  try {
    console.log(' Fetching bincard details for ID:', binCardId);
    
    const response = await fetch(`/api/bincard/bincardId?id=${binCardId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Fetch bincard by ID error response:', errorData);
      
      // Try stale cache on error
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log(' Using stale cache due to fetch error');
          return data;
        }
      } catch (fallbackError) {
        // Ignore
      }
      
      throw new Error(errorData.message || 'Failed to fetch bin card details');
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      // Cache the successful response
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: result.data,
          timestamp: Date.now()
        }));
        console.log(' Bincard details cached successfully');
      } catch (cacheError) {
        console.warn(' Failed to cache bincard details:', cacheError);
      }
      
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error fetching bincard by ID:', error);
    
    // Try stale cache on error
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.log(' Using stale cache due to fetch error');
        return data;
      }
    } catch (fallbackError) {
      // Ignore
    }
    
    throw error;
  }
}

// Create bin card with cache invalidation
export async function createBinCard(data: CreateBinCardRequest): Promise<any> {
  try {
    console.log(' Creating bin card with data:', data);
    
    const response = await fetch('/api/bincard', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(' Create bin card error response:', errorData);
      throw new Error(errorData.message || 'Failed to create bin card');
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      // Clear bincard caches after successful creation
      clearBinCardCache();
      return result.data;
    } else {
      throw new Error(result.message || 'Invalid response format');
    }
  } catch (error) {
    console.error(' Error creating bin card:', error);
    throw error;
  }
}

// Cache invalidation helper functions
export function clearBinCardCache(): void {
  try {
    // Clear all bincard-related caches
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('bincards_cache_') || key.startsWith('bincard_details_cache_')) {
        sessionStorage.removeItem(key);
      }
    });
    console.log(' Bincard caches cleared');
  } catch (error) {
    console.warn(' Failed to clear bincard cache:', error);
  }
}

export function clearBinCardDetailsCache(binCardId?: number): void {
  try {
    if (binCardId) {
      sessionStorage.removeItem(`bincard_details_cache_${binCardId}`);
      console.log(` Bincard details cache cleared for ID: ${binCardId}`);
    } else {
      // Clear all detail caches
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('bincard_details_cache_')) {
          sessionStorage.removeItem(key);
        }
      });
      console.log(' All bincard details caches cleared');
    }
  } catch (error) {
    console.warn(' Failed to clear bincard details cache:', error);
  }
}