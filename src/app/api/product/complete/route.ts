// import { NextRequest, NextResponse } from 'next/server'
// import { createServerClient } from '@/lib/supabase/server'
// import { verifyAccessToken } from '@/lib/jwt'
// import { getAuthTokenFromCookies } from '@/lib/cookies'

// // Helper function to extract employee ID from token
// function getEmployeeIdFromToken(accessToken: string): number {
//   try {
//     const payload = verifyAccessToken(accessToken);
//     return payload.userId || 1;
//   } catch (error) {
//     console.error('Error extracting employee ID from token:', error);
//     return 1;
//   }
// }


// // POST - Create complete product with all related data
// export async function POST(request: NextRequest) {
//   try {
//     const accessToken = getAuthTokenFromCookies(request)
//     if (!accessToken) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Access token not found',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     let employeeId: number;
//     try {
//       verifyAccessToken(accessToken)
//       employeeId = getEmployeeIdFromToken(accessToken)
//     } catch (error) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 401,
//           message: 'Invalid access token',
//           timestamp: new Date().toISOString()
//         },
//         { status: 401 }
//       )
//     }

//     const supabase = createServerClient()
//     const body = await request.json()
    
//     console.log('Received complete product data:', JSON.stringify(body, null, 2));
    
//     const { product, productVersion, productVariation, specs } = body

//     // Validate required data
//     if (!product || !productVersion || !productVariation) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Product, productVersion, and productVariation data are required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Validate specs array
//     if (!specs || !Array.isArray(specs)) {
//       console.log('Specs data is missing or invalid, proceeding without specs');
//     }

//     // Validate product data
//     if (!product.sku || !product.productName || !product.categoryId || !product.brandId || !product.modelId || !product.supplierId) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'SKU, product name, categoryId, brandId, modelId, and supplierId are required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Validate product version data
//     if (!productVersion.versionNumber || !productVersion.releaseDate) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Version number and release date are required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Validate product variation data
//     if (!productVariation.variationName) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 400,
//           message: 'Variation name is required',
//           timestamp: new Date().toISOString()
//         },
//         { status: 400 }
//       )
//     }

//     // Check if SKU already exists
//     const { data: existingProduct, error: checkError } = await supabase
//       .from('product')
//       .select('productId')
//       .eq('sku', product.sku)
//       .maybeSingle()

//     if (checkError) {
//       console.error('Error checking existing product:', checkError);
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to check existing product',
//           error: checkError.message,
//           timestamp: new Date().toISOString()
//         },
//         { status: 500 }
//       )
//     }

//     if (existingProduct) {
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 409,
//           message: 'SKU already exists',
//           timestamp: new Date().toISOString()
//         },
//         { status: 409 }
//       )
//     }

//     const currentTimestamp = new Date().toISOString();

//     // Start transaction by creating product first
//     const productData = {
//       sku: product.sku,
//       productName: product.productName,
//       description: product.description || '',
//       categoryId: product.categoryId,
//       brandId: product.brandId,
//       modelId: product.modelId,
//       supplierId: product.supplierId,
//       isActive: product.isActive !== undefined ? product.isActive : true,
//       createdBy: employeeId,
//       updatedBy: employeeId,
//       createdAt: currentTimestamp,
//       updatedAt: currentTimestamp
//     }
    
//     console.log('Creating product with data:', productData);
    
//     const { data: createdProduct, error: productError } = await supabase
//       .from('product')
//       .insert([productData])
//       .select(`
//         productId,
//         sku,
//         productName,
//         description,
//         categoryId,
//         brandId,
//         modelId,
//         supplierId,
//         isActive,
//         createdAt,
//         createdBy,
//         updatedAt,
//         updatedBy,
//         deletedAt,
//         deletedBy
//       `)
//       .single()

//     if (productError) {
//       console.error('Error creating product:', productError)
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to create product',
//           timestamp: new Date().toISOString(),
//           details: productError.message,
//           hint: 'Check if productId column is set as auto-increment/serial'
//         },
//         { status: 500 }
//       )
//     }

//     console.log('Created product:', createdProduct);

//     // Create product version
//     const versionData = {
//       productId: createdProduct.productId,
//       versionNumber: productVersion.versionNumber,
//       releaseDate: productVersion.releaseDate,
//       isActive: productVersion.isActive !== undefined ? productVersion.isActive : true,
//       createdAt: currentTimestamp,
//       createdBy: employeeId,
//       updatedAt: currentTimestamp,
//       updatedBy: employeeId
//     }

//     console.log('Creating product version with data:', versionData);

//     const { data: createdVersion, error: versionError } = await supabase
//       .from('productversion')
//       .insert([versionData])
//       .select('*')
//       .single()

//     if (versionError) {
//       console.error('Error creating product version:', versionError)
//       // Rollback: delete created product
//       await supabase.from('product').delete().eq('productId', createdProduct.productId)
      
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to create product version',
//           timestamp: new Date().toISOString(),
//           details: versionError.message
//         },
//         { status: 500 }
//       )
//     }

//     console.log('Created product version:', createdVersion);

//     // Create product variation
//     const variationData = {
//       versionId: createdVersion.versionId,
//       variationName: productVariation.variationName,
//       color: productVariation.color || '',
//       size: productVariation.size || '',
//       capacity: productVariation.capacity || '',
//       barcode: productVariation.barcode || '',
//       price: parseFloat(productVariation.price?.toString() || '0') || 0,
//       quantity: parseInt(productVariation.quantity?.toString() || '0') || 0,
//       minStockLevel: parseInt(productVariation.minStockLevel?.toString() || '0') || 0,
//       maxStockLevel: parseInt(productVariation.maxStockLevel?.toString() || '0') || 0,
//       isActive: productVariation.isActive !== undefined ? productVariation.isActive : true,
//       createdAt: currentTimestamp,
//       createdBy: employeeId,
//       updatedAt: currentTimestamp,
//       updatedBy: employeeId
//     }

//     console.log('Creating product variation with data:', variationData);

//     const { data: createdVariation, error: variationError } = await supabase
//       .from('productvariation')
//       .insert([variationData])
//       .select('*')
//       .single()

//     if (variationError) {
//       console.error('Error creating product variation:', variationError)
//       // Rollback: delete created product and version
//       await supabase.from('productversion').delete().eq('versionId', createdVersion.versionId)
//       await supabase.from('product').delete().eq('productId', createdProduct.productId)
      
//       return NextResponse.json(
//         { 
//           status: 'error',
//           code: 500,
//           message: 'Failed to create product variation',
//           timestamp: new Date().toISOString(),
//           details: variationError.message
//         },
//         { status: 500 }
//       )
//     }

//     console.log('Created product variation:', createdVariation);

//     // Create specs and spec details
//     const createdSpecs = []
//     const createdSpecDetails = []

//     if (specs && Array.isArray(specs) && specs.length > 0) {
//       console.log('Processing specs:', specs);
      
//       for (let i = 0; i < specs.length; i++) {
//         const spec = specs[i];
//         console.log(`Processing spec ${i}:`, spec);

//         // Validate spec data
//         if (!spec || !spec.specName || !spec.specValue) {
//           console.log(`Skipping invalid spec ${i}:`, spec);
//           continue;
//         }

//         const trimmedSpecName = spec.specName.trim();
//         const trimmedSpecValue = spec.specValue.trim();

//         if (!trimmedSpecName || !trimmedSpecValue) {
//           console.log(`Skipping empty spec ${i}:`, spec);
//           continue;
//         }

//         try {
//           // Check if spec with same name already exists
//           console.log('Checking for existing spec with name:', trimmedSpecName);
          
//           const { data: existingSpec, error: specCheckError } = await supabase
//             .from('specs')
//             .select('specId, specName')
//             .eq('specName', trimmedSpecName)
//             .maybeSingle()

//           if (specCheckError) {
//             console.error('Error checking existing spec:', specCheckError);
//             continue;
//           }

//           let specToUse;

//           if (existingSpec) {
//             // Use existing spec
//             specToUse = existingSpec;
//             console.log('Using existing spec:', existingSpec);
//           } else {
//             // Create new spec
//             const specData = {
//               specName: trimmedSpecName,
//               createdAt: currentTimestamp,
//               createdBy: employeeId,
//               updatedAt: currentTimestamp,
//               updatedBy: employeeId
//             }

//             console.log('Creating new spec with data:', specData);

//             const { data: createdSpec, error: specError } = await supabase
//               .from('specs')
//               .insert([specData])
//               .select('*')
//               .single()

//             if (specError) {
//               console.error('Error creating spec:', specError);
//               console.error('Spec error details:', JSON.stringify(specError, null, 2));
//               continue; // Skip this spec but continue with others
//             }

//             console.log('Created new spec:', createdSpec);
//             createdSpecs.push(createdSpec)
//             specToUse = createdSpec;
//           }

//           // Create spec detail
//           const specDetailData = {
//             variationId: createdVariation.variationId,
//             specId: specToUse.specId,
//             specValue: trimmedSpecValue,
//             createdAt: currentTimestamp,
//             createdBy: employeeId,
//             updatedAt: currentTimestamp,
//             updatedBy: employeeId
//           }

//           console.log('Creating spec detail with data:', specDetailData);

//           const { data: createdSpecDetail, error: specDetailError } = await supabase
//             .from('specdetails')
//             .insert([specDetailData])
//             .select('*')
//             .single()

//           if (specDetailError) {
//             console.error('Error creating spec detail:', specDetailError);
//             console.error('Spec detail error details:', JSON.stringify(specDetailError, null, 2));
//             continue; // Skip this spec detail but continue with others
//           }

//           console.log('Created spec detail:', createdSpecDetail);
//           createdSpecDetails.push(createdSpecDetail)

//         } catch (specProcessError) {
//           console.error(`Error processing spec ${i}:`, specProcessError);
//           continue; // Skip this spec and continue with others
//         }
//       }
//     } else {
//       console.log('No specs provided or specs array is empty');
//     }

//     const response = {
//       status: 'success',
//       code: 201,
//       message: 'Complete product created successfully',
//       timestamp: new Date().toISOString(),
//       data: {
//         product: createdProduct,
//         productVersion: createdVersion,
//         productVariation: createdVariation,
//         specs: createdSpecs,
//         specDetails: createdSpecDetails
//       }
//     };

//     console.log('Returning successful response:', JSON.stringify(response, null, 2));

//     return NextResponse.json(response, { status: 201 })

//   } catch (error) {
//     console.error('Complete product creation error:', error)
//     return NextResponse.json(
//       { 
//         status: 'error',
//         code: 500,
//         message: 'Internal server error',
//         timestamp: new Date().toISOString(),
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     )
//   }
// }


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { verifyAccessToken } from '@/lib/jwt'
import { getAuthTokenFromCookies } from '@/lib/cookies'

// Helper function to extract employee ID from token
function getEmployeeIdFromToken(accessToken: string): number {
  try {
    const payload = verifyAccessToken(accessToken);
    return payload.userId || 1;
  } catch (error) {
    console.error('Error extracting employee ID from token:', error);
    return 1;
  }
}



// POST - Create complete product with all related data
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request)
    if (!accessToken) {
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

    let employeeId: number;
    try {
      verifyAccessToken(accessToken)
      employeeId = getEmployeeIdFromToken(accessToken)
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    console.log(' Received complete product data:', JSON.stringify(body, null, 2));
    console.log(' Employee ID from token:', employeeId);
    
    const { product, productVersion, productVariation, specs } = body

    // Validate required data
    if (!product || !productVersion || !productVariation) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Product, productVersion, and productVariation data are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate specs array
    if (!specs || !Array.isArray(specs)) {
      console.log(' Specs data is missing or invalid, proceeding without specs');
    }

    // Validate product data
    if (!product.sku || !product.productName || !product.categoryId || !product.brandId || !product.modelId || !product.supplierId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'SKU, product name, categoryId, brandId, modelId, and supplierId are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate product version data
    if (!productVersion.versionNumber || !productVersion.releaseDate) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Version number and release date are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate product variation data
    if (!productVariation.variationName) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Variation name is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    try {
      // Check if SKU already exists
      const existingProduct = await prisma.product.findFirst({
        where: {
          sku: product.sku,
          deletedAt: null
        }
      })

      if (existingProduct) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 409,
            message: 'SKU already exists',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        )
      }

      // Validate foreign key references
      const [category, brand, model, supplier] = await Promise.all([
        prisma.category.findFirst({ where: { categoryId: parseInt(product.categoryId), deletedAt: null } }),
        prisma.brand.findFirst({ where: { brandId: parseInt(product.brandId), deletedAt: null } }),
        prisma.model.findFirst({ where: { modelId: parseInt(product.modelId), deletedAt: null } }),
        prisma.supplier.findFirst({ where: { supplierId: parseInt(product.supplierId), deletedAt: null } })
      ])

      if (!category) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid category ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      if (!brand) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid brand ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      if (!model) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid model ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      if (!supplier) {
        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: 'Invalid supplier ID',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Start transaction for creating complete product
      const result = await prisma.$transaction(async (tx) => {
        console.log(' Starting transaction for complete product creation');

        // Step 1: Create product
        const productData = {
          sku: product.sku,
          productName: product.productName,
          description: product.description || '',
          categoryId: parseInt(product.categoryId),
          brandId: parseInt(product.brandId),
          modelId: parseInt(product.modelId),
          supplierId: parseInt(product.supplierId),
          isActive: product.isActive !== undefined ? product.isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        }
        
        console.log(' Creating product with data:', productData);
        
        const createdProduct = await tx.product.create({
          data: productData,
          select: {
            productId: true,
            sku: true,
            productName: true,
            description: true,
            categoryId: true,
            brandId: true,
            modelId: true,
            supplierId: true,
            isActive: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          }
        })

        console.log(' Created product:', createdProduct);

        // Step 2: Create product version
        const versionData = {
          productId: createdProduct.productId,
          versionNumber: productVersion.versionNumber,
          releaseDate: new Date(productVersion.releaseDate),
          isActive: productVersion.isActive !== undefined ? productVersion.isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        }

        console.log(' Creating product version with data:', versionData);

        const createdVersion = await tx.productversion.create({
          data: versionData,
          select: {
            versionId: true,
            productId: true,
            versionNumber: true,
            releaseDate: true,
            isActive: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          }
        })

        console.log(' Created product version:', createdVersion);

        // Step 3: Create product variation
        const variationData = {
          versionId: createdVersion.versionId,
          variationName: productVariation.variationName,
          color: productVariation.color || '',
          size: productVariation.size || '',
          capacity: productVariation.capacity || '',
          barcode: productVariation.barcode || '',
          price: parseFloat(productVariation.price?.toString() || '0') || 0,
          quantity: parseInt(productVariation.quantity?.toString() || '0') || 0,
          minStockLevel: parseInt(productVariation.minStockLevel?.toString() || '0') || 0,
          maxStockLevel: parseInt(productVariation.maxStockLevel?.toString() || '0') || 0,
          isActive: productVariation.isActive !== undefined ? productVariation.isActive : true,
          createdBy: employeeId,
          updatedBy: employeeId
        }

        console.log(' Creating product variation with data:', variationData);

        const createdVariation = await tx.productvariation.create({
          data: variationData,
          select: {
            variationId: true,
            versionId: true,
            variationName: true,
            color: true,
            size: true,
            capacity: true,
            barcode: true,
            price: true,
            quantity: true,
            minStockLevel: true,
            maxStockLevel: true,
            isActive: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          }
        })

        console.log(' Created product variation:', createdVariation);

        // Step 4: Create specs and spec details
        const createdSpecs = []
        const createdSpecDetails = []

        if (specs && Array.isArray(specs) && specs.length > 0) {
          console.log(' Processing specs:', specs);
          
          for (let i = 0; i < specs.length; i++) {
            const spec = specs[i];
            console.log(` Processing spec ${i}:`, spec);

            // Validate spec data
            if (!spec || !spec.specName || !spec.specValue) {
              console.log(` Skipping invalid spec ${i}:`, spec);
              continue;
            }

            const trimmedSpecName = spec.specName.trim();
            const trimmedSpecValue = spec.specValue.trim();

            if (!trimmedSpecName || !trimmedSpecValue) {
              console.log(` Skipping empty spec ${i}:`, spec);
              continue;
            }

            try {
              // Check if spec with same name already exists (non-deleted)
              console.log(' Checking for existing spec with name:', trimmedSpecName);
              
              let existingSpec = await tx.specs.findFirst({
                where: {
                  specName: trimmedSpecName,
                  deletedAt: null
                }
              })

              let specToUse;

              if (existingSpec) {
                // Use existing spec
                specToUse = existingSpec;
                console.log(' Using existing spec:', existingSpec);
              } else {
                // Create new spec
                const specData = {
                  specName: trimmedSpecName,
                  createdBy: employeeId,
                  updatedBy: employeeId
                }

                console.log(' Creating new spec with data:', specData);

                const createdSpec = await tx.specs.create({
                  data: specData,
                  select: {
                    specId: true,
                    specName: true,
                    createdAt: true,
                    createdBy: true,
                    updatedAt: true,
                    updatedBy: true,
                    deletedAt: true,
                    deletedBy: true,
                  }
                })

                console.log(' Created new spec:', createdSpec);
                createdSpecs.push(createdSpec)
                specToUse = createdSpec;
              }

              // Create spec detail
              const specDetailData = {
                variationId: createdVariation.variationId,
                specId: specToUse.specId,
                specValue: trimmedSpecValue,
                createdBy: employeeId,
                updatedBy: employeeId
              }

              console.log(' Creating spec detail with data:', specDetailData);

              const createdSpecDetail = await tx.specdetails.create({
                data: specDetailData,
                select: {
                  specDetailId: true,
                  variationId: true,
                  specId: true,
                  specValue: true,
                  createdAt: true,
                  createdBy: true,
                  updatedAt: true,
                  updatedBy: true,
                  deletedAt: true,
                  deletedBy: true,
                }
              })

              console.log(' Created spec detail:', createdSpecDetail);
              createdSpecDetails.push(createdSpecDetail)

            } catch (specProcessError) {
              console.error(` Error processing spec ${i}:`, specProcessError);
              continue; // Skip this spec and continue with others
            }
          }
        } else {
          console.log(' No specs provided or specs array is empty');
        }

        return {
          product: createdProduct,
          productVersion: createdVersion,
          productVariation: createdVariation,
          specs: createdSpecs,
          specDetails: createdSpecDetails
        }
      })

      const response = {
        status: 'success',
        code: 201,
        message: 'Complete product created successfully',
        timestamp: new Date().toISOString(),
        data: result
      };

      console.log(' Returning successful response:', JSON.stringify(response, null, 2));

      return NextResponse.json(response, { status: 201 })

    } catch (dbError) {
      console.error(' Database error:', dbError)
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to create complete product',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error(' Complete product creation error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}










/**
 * @swagger
 * /api/product/complete:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a complete product
 *     description: Create a product with version, variation, and specifications in a single transaction
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - productVersion
 *               - productVariation
 *             properties:
 *               product:
 *                 type: object
 *                 required:
 *                   - sku
 *                   - productName
 *                   - categoryId
 *                   - brandId
 *                   - modelId
 *                   - supplierId
 *                 properties:
 *                   sku:
 *                     type: string
 *                     description: Stock Keeping Unit (unique identifier)
 *                     example: "LAP001"
 *                   productName:
 *                     type: string
 *                     description: Product name
 *                     example: "MacBook Pro 16-inch"
 *                   description:
 *                     type: string
 *                     description: Product description
 *                     example: "High-performance laptop for professionals"
 *                   categoryId:
 *                     type: integer
 *                     description: Category ID
 *                     example: 1
 *                   brandId:
 *                     type: integer
 *                     description: Brand ID
 *                     example: 1
 *                   modelId:
 *                     type: integer
 *                     description: Model ID
 *                     example: 1
 *                   supplierId:
 *                     type: integer
 *                     description: Supplier ID
 *                     example: 1
 *                   isActive:
 *                     type: boolean
 *                     description: Active status
 *                     default: true
 *               productVersion:
 *                 type: object
 *                 required:
 *                   - versionNumber
 *                   - releaseDate
 *                 properties:
 *                   versionNumber:
 *                     type: string
 *                     description: Version number
 *                     example: "v1.0"
 *                   releaseDate:
 *                     type: string
 *                     format: date
 *                     description: Release date
 *                     example: "2023-12-01"
 *                   isActive:
 *                     type: boolean
 *                     description: Active status
 *                     default: true
 *               productVariation:
 *                 type: object
 *                 required:
 *                   - variationName
 *                 properties:
 *                   variationName:
 *                     type: string
 *                     description: Variation name
 *                     example: "16GB RAM / 512GB SSD / Space Gray"
 *                   color:
 *                     type: string
 *                     description: Color
 *                     example: "Space Gray"
 *                   size:
 *                     type: string
 *                     description: Size
 *                     example: "16-inch"
 *                   capacity:
 *                     type: string
 *                     description: Storage capacity
 *                     example: "512GB"
 *                   barcode:
 *                     type: string
 *                     description: Barcode
 *                     example: "1234567890123"
 *                   price:
 *                     type: number
 *                     format: float
 *                     description: Price
 *                     example: 2499.99
 *                   quantity:
 *                     type: integer
 *                     description: Initial quantity
 *                     example: 10
 *                   minStockLevel:
 *                     type: integer
 *                     description: Minimum stock level
 *                     example: 5
 *                   maxStockLevel:
 *                     type: integer
 *                     description: Maximum stock level
 *                     example: 50
 *                   isActive:
 *                     type: boolean
 *                     description: Active status
 *                     default: true
 *               specs:
 *                 type: array
 *                 description: Product specifications
 *                 items:
 *                   type: object
 *                   required:
 *                     - specName
 *                     - specValue
 *                   properties:
 *                     specName:
 *                       type: string
 *                       description: Specification name
 *                       example: "RAM"
 *                     specValue:
 *                       type: string
 *                       description: Specification value
 *                       example: "16GB"
 *     responses:
 *       201:
 *         description: Complete product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Complete product created successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *                     productVersion:
 *                       $ref: '#/components/schemas/ProductVersion'
 *                     productVariation:
 *                       $ref: '#/components/schemas/ProductVariation'
 *                     specs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Specification'
 *                     specDetails:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SpecificationDetail'
 *       400:
 *         description: Bad request - Missing or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       409:
 *         description: SKU already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */