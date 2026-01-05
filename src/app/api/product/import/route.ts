import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyAccessToken } from '@/lib/jwt';
import { getAuthTokenFromCookies } from '@/lib/cookies';
import { parse } from 'csv-parse/sync';

type ProductCsvRow = {
  productId?: string;
  sku: string;
  productName: string;
  description?: string;
  categoryId: string;
  brandId: string;
  modelId: string;
  supplierId: string;
  isActive?: string;
};

/**
 * @swagger
 * /api/product/import:
 *   post:
 *     tags:
 *       - Products
 *     summary: Bulk import products from CSV
 *     description: Import product records from CSV file
 *     security:
 *       - cookieAuth: []
 */
export async function POST(request: NextRequest) {
  console.log(' Product Import POST request started');
  
  let importFileRecord: any = null;

  try {
    // Verify authentication
    const accessToken = getAuthTokenFromCookies(request);
    if (!accessToken) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Access token not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    let employeeId: number;
    try {
      verifyAccessToken(accessToken);
      const payload = verifyAccessToken(accessToken);
      employeeId = payload.userId || 1;
      console.log(' Access token verified, employee ID:', employeeId);
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'No file uploaded',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Only CSV files are allowed',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'File size must be less than 10MB',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Create importfile record BEFORE processing
    try {
      importFileRecord = await prisma.importfile.create({
        data: {
          EmployeeID: employeeId,
          fileName: file.name,
          fileType: 'CSV',
          importDate: new Date(),
          status: 'PROCESSING',
          errorCount: 0,
          remarks: `Product import - ${file.name}`,
          filePath: null
        }
      });
      console.log(' Created importfile record:', importFileRecord.importId);
    } catch (importFileError) {
      console.error(' Failed to create importfile record:', importFileError);
    }

    // Parse CSV
    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ProductCsvRow[];

    if (!records.length) {
      if (importFileRecord) {
        try {
          await prisma.importfile.update({
            where: { importId: importFileRecord.importId },
            data: {
              status: 'FAILED',
              errorCount: 0,
              remarks: 'CSV file is empty'
            }
          });
        } catch (updateError) {
          console.error('Failed to update importfile record:', updateError);
        }
      }

      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'CSV file is empty',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validate required columns
    const requiredColumns = ['sku', 'productName', 'categoryId', 'brandId', 'modelId', 'supplierId'];
    const firstRow = records[0];
    
    for (const col of requiredColumns) {
      if (!(col in firstRow)) {
        if (importFileRecord) {
          try {
            await prisma.importfile.update({
              where: { importId: importFileRecord.importId },
              data: {
                status: 'FAILED',
                errorCount: 0,
                remarks: `Missing required column: ${col}`
              }
            });
          } catch (updateError) {
            console.error('Failed to update importfile record:', updateError);
          }
        }

        return NextResponse.json(
          { 
            status: 'error',
            code: 400,
            message: `Missing required column: ${col}`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }
    }

    // Process import in transaction
    const result = await prisma.$transaction(async (tx) => {
      const errors: string[] = [];
      const successes: any[] = [];
      let processedCount = 0;

      // Pre-validate all foreign keys
      const categoryIds = new Set<number>();
      const brandIds = new Set<number>();
      const modelIds = new Set<number>();
      const supplierIds = new Set<number>();
      
      for (const row of records) {
        if (row.categoryId) categoryIds.add(parseInt(row.categoryId));
        if (row.brandId) brandIds.add(parseInt(row.brandId));
        if (row.modelId) modelIds.add(parseInt(row.modelId));
        if (row.supplierId) supplierIds.add(parseInt(row.supplierId));
      }

      // Verify all foreign keys exist
      const [categories, brands, models, suppliers] = await Promise.all([
        tx.category.findMany({
          where: { categoryId: { in: Array.from(categoryIds) }, deletedAt: null },
          select: { categoryId: true }
        }),
        tx.brand.findMany({
          where: { brandId: { in: Array.from(brandIds) }, deletedAt: null },
          select: { brandId: true }
        }),
        tx.model.findMany({
          where: { modelId: { in: Array.from(modelIds) }, deletedAt: null },
          select: { modelId: true }
        }),
        tx.supplier.findMany({
          where: { supplierId: { in: Array.from(supplierIds) }, deletedAt: null },
          select: { supplierId: true }
        })
      ]);

      const validCategoryIds = new Set(categories.map(c => c.categoryId));
      const validBrandIds = new Set(brands.map(b => b.brandId));
      const validModelIds = new Set(models.map(m => m.modelId));
      const validSupplierIds = new Set(suppliers.map(s => s.supplierId));

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 because row 1 is header

        try {
          const sku = row.sku?.trim();
          const productName = row.productName?.trim();
          const description = row.description?.trim() || '';
          const categoryId = parseInt(row.categoryId);
          const brandId = parseInt(row.brandId);
          const modelId = parseInt(row.modelId);
          const supplierId = parseInt(row.supplierId);
          const isActive = row.isActive !== undefined 
            ? row.isActive.toLowerCase() === 'true' || row.isActive === '1'
            : true;

          // Validate row data
          if (!sku || sku.length < 2) {
            errors.push(`Row ${rowNumber}: Invalid or missing SKU`);
            continue;
          }

          if (!productName || productName.length < 2) {
            errors.push(`Row ${rowNumber}: Invalid or missing product name`);
            continue;
          }

          if (isNaN(categoryId) || !validCategoryIds.has(categoryId)) {
            errors.push(`Row ${rowNumber}: Invalid categoryId ${row.categoryId}`);
            continue;
          }

          if (isNaN(brandId) || !validBrandIds.has(brandId)) {
            errors.push(`Row ${rowNumber}: Invalid brandId ${row.brandId}`);
            continue;
          }

          if (isNaN(modelId) || !validModelIds.has(modelId)) {
            errors.push(`Row ${rowNumber}: Invalid modelId ${row.modelId}`);
            continue;
          }

          if (isNaN(supplierId) || !validSupplierIds.has(supplierId)) {
            errors.push(`Row ${rowNumber}: Invalid supplierId ${row.supplierId}`);
            continue;
          }

          // Check if product exists (by SKU or productId if provided)
          let existingProduct = null;
          if (row.productId) {
            const productId = parseInt(row.productId);
            if (!isNaN(productId)) {
              existingProduct = await tx.product.findFirst({
                where: {
                  productId: productId,
                  deletedAt: null
                }
              });
            }
          }

          if (!existingProduct) {
            existingProduct = await tx.product.findFirst({
              where: {
                sku: sku,
                deletedAt: null
              }
            });
          }

          let productUpdate;
          let finalProduct;

          if (existingProduct) {
            // Update existing product
            finalProduct = await tx.product.update({
              where: { productId: existingProduct.productId },
              data: {
                sku,
                productName,
                description,
                categoryId,
                brandId,
                modelId,
                supplierId,
                isActive,
                updatedBy: employeeId
              }
            });

            productUpdate = {
              productId: finalProduct.productId,
              sku: finalProduct.sku,
              action: 'updated'
            };
          } else {
            // Create new product
            finalProduct = await tx.product.create({
              data: {
                sku,
                productName,
                description,
                categoryId,
                brandId,
                modelId,
                supplierId,
                isActive,
                createdBy: employeeId,
                updatedBy: employeeId
              }
            });

            productUpdate = {
              productId: finalProduct.productId,
              sku: finalProduct.sku,
              action: 'created'
            };
          }

          // Create transaction log
          await tx.transactionlog.create({
            data: {
              employeeId: employeeId,
              actionType: 'BULK_IMPORT',
              entityName: 'PRODUCT',
              referenceId: finalProduct.productId,
              actionDate: new Date(),
              oldValue: existingProduct ? JSON.stringify({
                sku: existingProduct.sku,
                productName: existingProduct.productName
              }) : null,
              newValue: JSON.stringify({
                sku: finalProduct.sku,
                productName: finalProduct.productName,
                categoryId,
                brandId,
                modelId,
                supplierId,
                isActive
              })
            }
          });

          successes.push(productUpdate);
          processedCount++;

        } catch (rowError) {
          errors.push(`Row ${rowNumber}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
        }
      }

      // Update importfile record with results
      if (importFileRecord) {
        try {
          await tx.importfile.update({
            where: { importId: importFileRecord.importId },
            data: {
              status: errors.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
              errorCount: errors.length,
              remarks: `Product import - ${successes.length} successful, ${errors.length} errors`
            }
          });
        } catch (updateError) {
          console.error(' Failed to update importfile record:', updateError);
        }
      }

      return {
        totalRows: records.length,
        processedCount,
        successCount: successes.length,
        errorCount: errors.length,
        errors,
        successes,
        importFileId: importFileRecord?.importId
      };
    }, {
      timeout: 30000, // 30 second timeout
    });

    return NextResponse.json(
      {
        status: 'success',
        code: 200,
        message: `Import completed: ${result.successCount} successful, ${result.errorCount} errors`,
        timestamp: new Date().toISOString(),
        data: {
          totalRows: result.totalRows,
          processedCount: result.processedCount,
          successCount: result.successCount,
          errorCount: result.errorCount,
          errors: result.errors.length > 0 ? result.errors : null,
          importFileId: result.importFileId,
          summary: {
            created: result.successes.filter(s => s.action === 'created').length,
            updated: result.successes.filter(s => s.action === 'updated').length
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(' Product Import error:', error);
    
    if (importFileRecord) {
      try {
        await prisma.importfile.update({
          where: { importId: importFileRecord.importId },
          data: {
            status: 'FAILED',
            errorCount: 0,
            remarks: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        });
      } catch (updateError) {
        console.error(' Failed to update importfile record with error:', updateError);
      }
    }
    
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Failed to import products',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}