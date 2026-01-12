import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { authenticateRequest } from '@/lib/api-auth'
import { getRoleName } from '@/lib/auth-helpers'

interface LowStockItem {
  stockId: number;
  productId: number;
  productName: string;
  productSku?: string | null;
  brandName?: string | null;
  categoryName?: string | null;
  variationId: number | null;
  variationName?: string | null;
  variationColor?: string | null;
  variationSize?: string | null;
  variationCapacity?: string | null;
  quantityAvailable: number;
  reorderLevel: number;
  location?: string | null;
  lastUpdatedDate: string;
}

// Generate return number for reference
function generateReturnReference(returnId: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `RTN-${year}${month}${day}-${String(returnId).padStart(6, '0')}`;
}

// GET - Get dashboard data including pending returns
export async function GET(request: NextRequest) {
  console.log(' Home dashboard GET request started');
  
  try {
    // Verify authentication using Supabase
    const { employeeId, response: authError } = await authenticateRequest(request)
    
    if (authError) {
      return authError
    }

    const employee = await prisma.employees.findUnique({
      where: { EmployeeID: employeeId },
      select: {
        EmployeeID: true,
        Email: true,
        Phone: true,
        UserName: true,
        RoleID: true,
        CreatedBy: true,
        CreatedDate: true
      }
    })
    if (!employee) {
      return NextResponse.json(
        {
          status: 'error',
          code: 404,
          message: 'Employee not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    console.log(' Access token verified, employee ID:', employeeId);

    try {
      // OPTIMIZATION: Run all independent queries in parallel using Promise.all
      const [pendingReturns, totalReturns, approvedReturns, rejectedReturns, lowStockItems] = await Promise.all([
        // Get pending returns with details
        prisma.returns.findMany({
          where: {
            returnStatus: 'PENDING',
            approved: false
          },
          include: {
            supplier: {
              select: {
                supplierId: true,
                supplierName: true,
                contactPerson: true,
                email: true,
                phone: true
              }
            },
            employees: {
              select: {
                EmployeeID: true,
                UserName: true,
                Email: true
              }
            },
            returnproduct: {
              include: {
                productvariation: {
                  include: {
                    version: {
                      include: {
                        product: {
                          select: {
                            productId: true,
                            productName: true,
                            sku: true,
                            description: true,
                            brand: {
                              select: {
                                brandName: true
                              }
                            },
                            category: {
                              select: {
                                categoryName: true
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            returnDate: 'desc'
          }
        }),
        // Get dashboard statistics - all in parallel
        prisma.returns.count(),
        prisma.returns.count({
          where: {
            returnStatus: 'APPROVED'
          }
        }),
        prisma.returns.count({
          where: {
            returnStatus: 'REJECTED'
          }
        }),
        // Get low stock items
        prisma.stock.findMany({
          where: {
            OR: [
              {
                quantityAvailable: {
                  lte: prisma.stock.fields.reorderLevel
                }
              },
              {
                quantityAvailable: 0
              }
            ]
          },
          include: {
            product: {
              select: {
                productName: true,
                sku: true,
                brand: {
                  select: {
                    brandName: true
                  }
                },
                category: {
                  select: {
                    categoryName: true
                  }
                }
              }
            },
            productvariation: {
              select: {
                variationName: true,
                color: true,
                size: true,
                capacity: true
              }
            }
          },
          orderBy: [
            {
              quantityAvailable: 'asc'
            },
            {
              productId: 'asc'
            }
          ],
          take: 10 // Limit to top 10 most critical items
        })
      ]);

      // Transform pending returns for response
      const transformedPendingReturns = pendingReturns.map(returnItem => ({
        returnId: returnItem.returnId,
        returnNumber: `RT-${String(returnItem.returnId).padStart(6, '0')}`,
        returnedBy: returnItem.employeeId,
        returnDate: returnItem.returnDate?.toISOString()?.split('T')[0] || null,
        reason: returnItem.reason,
        status: returnItem.returnStatus,
        remarks: returnItem.remarks,
        returnType: returnItem.returnType,
        approved: returnItem.approved,
        supplier: {
          supplierId: returnItem.supplier.supplierId,
          supplierName: returnItem.supplier.supplierName,
          contactPerson: returnItem.supplier.contactPerson,
          email: returnItem.supplier.email,
          phone: returnItem.supplier.phone
        },
        employee: {
          employeeId: returnItem.employees.EmployeeID,
          userName: returnItem.employees.UserName,
          email: returnItem.employees.Email
        },
        details: returnItem.returnproduct.map(rp => ({
          returnProductId: rp.returnProductId,
          productId: rp.productvariation.version.product.productId,
          productName: rp.productvariation.version.product.productName,
          productSku: rp.productvariation.version.product.sku,
          productDescription: rp.productvariation.version.product.description,
          brandName: rp.productvariation.version.product.brand?.brandName,
          categoryName: rp.productvariation.version.product.category?.categoryName,
          variationId: rp.variationId,
          variationName: rp.productvariation.variationName,
          variationColor: rp.productvariation.color,
          variationSize: rp.productvariation.size,
          variationCapacity: rp.productvariation.capacity,
          quantityReturned: rp.quantity,
          remarks: rp.remarks
        }))
      }));

      // OPTIMIZATION: Calculate outOfStockItems during map instead of separate filter
      let outOfStockItems = 0;
      const transformedLowStockItems: LowStockItem[] = lowStockItems.map(stock => {
        const quantityAvailable = stock.quantityAvailable || 0;
        if (quantityAvailable === 0) {
          outOfStockItems++;
        }
        return {
          stockId: stock.stockId,
          productId: stock.productId,
          productName: stock.product?.productName || 'Unknown Product',
          productSku: stock.product?.sku,
          brandName: stock.product?.brand?.brandName,
          categoryName: stock.product?.category?.categoryName,
          variationId: stock.variationId,
          variationName: stock.productvariation?.variationName,
          variationColor: stock.productvariation?.color,
          variationSize: stock.productvariation?.size,
          variationCapacity: stock.productvariation?.capacity,
          quantityAvailable: quantityAvailable,
          reorderLevel: stock.reorderLevel || 0,
          location: stock.location,
          lastUpdatedDate: stock.lastUpdatedDate?.toISOString() || new Date().toISOString()
        };
      });

      // Calculate additional stock statistics
      const totalLowStockItems = lowStockItems.length;

      const dashboardData = {
        statistics: {
          totalReturns,
          pendingReturns: pendingReturns.length,
          approvedReturns,
          rejectedReturns,
          totalLowStockItems,
          outOfStockItems
        },
        pendingReturns: transformedPendingReturns,
        lowStockItems: transformedLowStockItems
      };

      console.log(` Found ${pendingReturns.length} pending returns and ${totalLowStockItems} low stock items`);

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Dashboard data retrieved successfully',
          timestamp: new Date().toISOString(),
          data: {
            user: employee, // Include user data
            role: getRoleName(employee.RoleID),
            ...dashboardData
          } 
        },
        { status: 200 ,
          headers: {
            'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' // Cache for 60 seconds, allow stale for 120 seconds
          }
        }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve dashboard data - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Home dashboard GET error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST - Approve return from home dashboard WITH STOCK UPDATES
export async function POST(request: NextRequest) {
  console.log(' Home approve return POST request started');
  
  try {
    // Verify authentication using Supabase
    const { employeeId, response: authError } = await authenticateRequest(request)
    
    if (authError) {
      return authError
    }

    console.log(' Access token verified, employee ID:', employeeId);

    const body = await request.json()
    const { returnId } = body;

    if (!returnId || isNaN(parseInt(returnId))) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Valid return ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Check if return exists and is pending with its products
    const existingReturn = await prisma.returns.findUnique({
      where: { returnId: parseInt(returnId) },
      include: {
        returnproduct: {
          include: {
            productvariation: {
              select: {
                variationId: true,
                variationName: true,
                version: {
                  select: {
                    product: {
                      select: {
                        productId: true,
                        productName: true,
                        sku: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!existingReturn) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 404,
          message: 'Return not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    if (existingReturn.returnStatus !== 'PENDING') {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Only pending returns can be approved',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // OPTIMIZATION: BEFORE TRANSACTION - Collect all product/variation combinations and fetch stocks in ONE query
    console.log(' Validating stock availability for return items...');
    
    const stockQueries = existingReturn.returnproduct
      .filter(rp => (rp.quantity || 0) > 0)
      .map(rp => ({
        productId: rp.productvariation.version.product.productId,
        variationId: rp.variationId
      }));

    // Fetch all stocks in ONE query instead of N queries
    const stocks = await prisma.stock.findMany({
      where: {
        OR: stockQueries.map(sq => ({
          productId: sq.productId,
          variationId: sq.variationId
        }))
      }
    });

    // Create a map for O(1) lookup instead of N queries
    const stockMap = new Map(
      stocks.map(s => [`${s.productId}-${s.variationId}`, s])
    );

    // Validate using the map (no database queries in loop)
    for (const returnProduct of existingReturn.returnproduct) {
      const productId = returnProduct.productvariation.version.product.productId;
      const variationId = returnProduct.variationId;
      const quantityToDeduct = returnProduct.quantity || 0;

      if (quantityToDeduct <= 0) {
        continue; // Skip if no quantity to deduct
      }

      const stockKey = `${productId}-${variationId}`;
      const existingStock = stockMap.get(stockKey);

      if (!existingStock) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: `No stock found for product "${returnProduct.productvariation.version.product.productName}" (Variation: ${returnProduct.productvariation.variationName})`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      const availableQuantity = existingStock.quantityAvailable || 0;
      if (availableQuantity < quantityToDeduct) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: `Insufficient stock for product "${returnProduct.productvariation.version.product.productName}" (Variation: ${returnProduct.productvariation.variationName}). Available: ${availableQuantity}, Required: ${quantityToDeduct}`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Execute the approval and stock updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log(' Starting transaction for return approval and stock updates...');

      // 1. Update return status and approval
      const updatedReturn = await tx.returns.update({
        where: { returnId: parseInt(returnId) },
        data: {
          approved: true,
          returnStatus: 'APPROVED'
        }
      });

      console.log(` Return ${returnId} status updated to APPROVED`);

      // OPTIMIZATION: Fetch all stocks needed for transaction in ONE query instead of N queries
      // Re-fetch stocks within transaction to ensure we have the latest data
      const transactionStocks = await tx.stock.findMany({
        where: {
          OR: stockQueries.map(sq => ({
            productId: sq.productId,
            variationId: sq.variationId
          }))
        }
      });

      // Create stock map for transaction
      const transactionStockMap = new Map(
        transactionStocks.map(s => [`${s.productId}-${s.variationId}`, s])
      );

      // 2. Process each return product and update stock
      const stockUpdates: any[] = [];
      const binCardEntries: any[] = [];
      const productDetails: any[] = [];
      const returnReference = generateReturnReference(parseInt(returnId));

      for (const returnProduct of existingReturn.returnproduct) {
        const productId = returnProduct.productvariation.version.product.productId;
        const variationId = returnProduct.variationId;
        const quantityToDeduct = returnProduct.quantity || 0;

        if (quantityToDeduct <= 0) {
          console.log(`  Skipping return product ${returnProduct.returnProductId} - no quantity to deduct`);
          continue;
        }

        console.log(` Processing return product: ${returnProduct.productvariation.version.product.productName} (${quantityToDeduct} units)`);

        // Use the stock map instead of querying database
        const stockKey = `${productId}-${variationId}`;
        const existingStock = transactionStockMap.get(stockKey);

        if (existingStock) {
          const quantityBefore = existingStock.quantityAvailable || 0;
          const quantityAfter = quantityBefore - quantityToDeduct;

          // Update stock quantity
          const updatedStock = await tx.stock.update({
            where: { stockId: existingStock.stockId },
            data: {
              quantityAvailable: quantityAfter,
              lastUpdatedDate: new Date()
            }
          });

          console.log(` Stock updated: ${quantityBefore} → ${quantityAfter} (Product: ${returnProduct.productvariation.version.product.productName})`);

          stockUpdates.push({
            stockId: existingStock.stockId,
            productId: productId,
            variationId: variationId,
            productName: returnProduct.productvariation.version.product.productName,
            variationName: returnProduct.productvariation.variationName,
            quantityBefore: quantityBefore,
            quantityAfter: quantityAfter,
            quantityDeducted: quantityToDeduct,
            action: 'deducted'
          });

          // Create bin card entry for stock deduction
          const binCardEntry = await tx.bincard.create({
            data: {
              variationId: variationId,
              transactionDate: new Date(),
              transactionType: 'RETURN_OUT',
              referenceId: parseInt(returnId),
              quantityIn: null,
              quantityOut: quantityToDeduct,
              balance: quantityAfter,
              employeeId: employeeId,
              remarks: `Return Approved: ${returnReference} - Stock deducted for returned items`
            }
          });

          binCardEntries.push({
            binCardId: binCardEntry.bincardId,
            variationId: variationId,
            transactionType: 'RETURN_OUT',
            quantityOut: quantityToDeduct,
            balance: quantityAfter,
            transactionDate: binCardEntry.transactionDate?.toISOString()
          });

          productDetails.push({
            returnProductId: returnProduct.returnProductId,
            productId: productId,
            productName: returnProduct.productvariation.version.product.productName,
            productSku: returnProduct.productvariation.version.product.sku,
            variationId: variationId,
            variationName: returnProduct.productvariation.variationName,
            quantityReturned: quantityToDeduct,
            stockBefore: quantityBefore,
            stockAfter: quantityAfter
          });
        }
      }

      // 3. Create comprehensive transaction log
      await tx.transactionlog.create({
        data: {
          employeeId: employeeId,
          actionType: 'APPROVE_RETURN',
          entityName: 'RETURN',
          referenceId: parseInt(returnId),
          actionDate: new Date(),
          oldValue: JSON.stringify({
            returnId: existingReturn.returnId,
            approved: existingReturn.approved,
            returnStatus: existingReturn.returnStatus,
            productCount: existingReturn.returnproduct.length
          }),
          newValue: JSON.stringify({
            returnId: updatedReturn.returnId,
            approved: updatedReturn.approved,
            returnStatus: updatedReturn.returnStatus,
            approvedBy: employeeId,
            stockUpdatesCount: stockUpdates.length,
            totalQuantityDeducted: stockUpdates.reduce((sum, update) => sum + update.quantityDeducted, 0),
            approvedAt: new Date().toISOString(),
            stockUpdates: stockUpdates,
            binCardEntriesCreated: binCardEntries.length
          })
        }
      });

      console.log(` Transaction log created for return approval and stock updates`);

      return {
        updatedReturn,
        stockUpdates,
        binCardEntries,
        productDetails,
        summary: {
          totalItemsProcessed: stockUpdates.length,
          totalQuantityDeducted: stockUpdates.reduce((sum, update) => sum + update.quantityDeducted, 0),
          stockEntriesUpdated: stockUpdates.length,
          binCardEntriesCreated: binCardEntries.length
        }
      };
    }, {
      maxWait: 10000,  // 10 seconds
      timeout: 20000,  // 20 seconds
    });

    console.log(` Return ${returnId} approved successfully with stock updates`);

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: 'Return approved successfully and stock updated',
        timestamp: new Date().toISOString(),
        data: {
          returnId: result.updatedReturn.returnId,
          approved: result.updatedReturn.approved,
          returnStatus: result.updatedReturn.returnStatus,
          stockUpdates: result.stockUpdates,
          binCardEntries: result.binCardEntries,
          productDetails: result.productDetails,
          summary: result.summary,
          auditTrail: {
            approvedBy: employeeId,
            approvedAt: new Date().toISOString(),
            transactionLogCreated: true,
            binCardEntriesCreated: result.binCardEntries.length,
            stockUpdatesCompleted: result.stockUpdates.length
          }
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error(' Home approve return POST error:', error)
    
    let errorMessage = 'Failed to approve return';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Insufficient stock')) {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message.includes('No stock found')) {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message.includes('Transaction')) {
        statusCode = 500;
        errorMessage = 'Database transaction error. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        status: 'error',
        code: statusCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? {
          type: error.constructor.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : undefined
      },
      { status: statusCode }
    )
  }
}