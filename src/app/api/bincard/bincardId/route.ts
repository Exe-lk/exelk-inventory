import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createServerClient } from '@/lib/supabase/server'

/**
 * @swagger
 * /api/bincard/bincardId:
 *   get:
 *     tags:
 *       - BinCards
 *     summary: Get bin card by ID
 *     description: Retrieve a single bin card by ID with all details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bin card ID
 */

// GET - Retrieve a single bin card by ID using query parameter
export async function GET(request: NextRequest) {
  console.log(' Single BinCard GET request started');
  
  try {
    // Verify authentication using Supabase
    const supabase = await createServerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    console.log(' Access token verified');

    // Get ID from query parameters instead of path parameters
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log(' Requested bin card ID:', id);

    if (!id) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Bin card ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const binCardId = parseInt(id)

    if (isNaN(binCardId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Invalid bin card ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Get bin card with all related data
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
      })

      if (!binCard) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 404,
            message: 'Bin card not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      console.log(' Bin card found:', binCard.bincardId);

      // Transform data for response with all details
      const transformedBinCard = {
        binCardId: binCard.bincardId,
        variationId: binCard.variationId,
        transactionDate: binCard.transactionDate?.toISOString().split('T')[0],
        transactionType: binCard.transactionType,
        referenceId: binCard.referenceId,
        quantityIn: binCard.quantityIn || 0,
        quantityOut: binCard.quantityOut || 0,
        balance: binCard.balance || 0,
        stockKeeperId: binCard.employeeId,
        remarks: binCard.remarks,
        
        // Stock keeper details
        stockKeeper: {
          id: binCard.employees?.EmployeeID,
          name: binCard.employees?.UserName,
          email: binCard.employees?.Email,
          phone: binCard.employees?.Phone
        },
        
        // Product variation details
        variation: {
          id: binCard.productvariation?.variationId,
          name: binCard.productvariation?.variationName,
          color: binCard.productvariation?.color,
          size: binCard.productvariation?.size,
          capacity: binCard.productvariation?.capacity,
          barcode: binCard.productvariation?.barcode,
          price: binCard.productvariation?.price ? parseFloat(binCard.productvariation.price.toString()) : null,
          quantity: binCard.productvariation?.quantity,
          minStockLevel: binCard.productvariation?.minStockLevel,
          maxStockLevel: binCard.productvariation?.maxStockLevel
        },
        
        // Product version details
        version: {
          id: binCard.productvariation?.version?.versionId,
          number: binCard.productvariation?.version?.versionNumber,
          releaseDate: binCard.productvariation?.version?.releaseDate?.toISOString().split('T')[0]
        },
        
        // Product details
        product: {
          id: binCard.productvariation?.version?.product?.productId,
          name: binCard.productvariation?.version?.product?.productName,
          sku: binCard.productvariation?.version?.product?.sku,
          description: binCard.productvariation?.version?.product?.description,
          
          // Brand details
          brand: {
            id: binCard.productvariation?.version?.product?.brand?.brandId,
            name: binCard.productvariation?.version?.product?.brand?.brandName,
            country: binCard.productvariation?.version?.product?.brand?.country
          },
          
          // Category details
          category: {
            id: binCard.productvariation?.version?.product?.category?.categoryId,
            name: binCard.productvariation?.version?.product?.category?.categoryName,
            mainCategory: binCard.productvariation?.version?.product?.category?.mainCategory
          },
          
          // Model details
          model: {
            id: binCard.productvariation?.version?.product?.model?.modelId,
            name: binCard.productvariation?.version?.product?.model?.modelName,
            description: binCard.productvariation?.version?.product?.model?.description
          },
          
          // Supplier details
          supplier: {
            id: binCard.productvariation?.version?.product?.supplier?.supplierId,
            name: binCard.productvariation?.version?.product?.supplier?.supplierName,
            contactPerson: binCard.productvariation?.version?.product?.supplier?.contactPerson,
            email: binCard.productvariation?.version?.product?.supplier?.email,
            phone: binCard.productvariation?.version?.product?.supplier?.phone
          }
        }
      }

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Bin card retrieved successfully',
          timestamp: new Date().toISOString(),
          data: transformedBinCard
        },
        { status: 200 }
      )

    } catch (dbError) {
      console.error(' Database error:', dbError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to retrieve bin card - Database error',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Single BinCard GET error:', error)
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