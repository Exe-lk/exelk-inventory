import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createServerClient } from '@/lib/supabase/server';
import { parse } from 'csv-parse/sync';

type StockCsvRow = {
  productId: string;
  variationId?: string;
  quantityAvailable: string;
  reorderLevel?: string;
  location?: string;
};

/**
 * @swagger
 * /api/stock/import:
 *   post:
 *     tags:
 *       - Stock
 *     summary: Bulk import stock from CSV
 *     description: Import stock records from CSV file
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Stock imported successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  console.log(' Stock Import POST request started');
  
  let importFileRecord: any = null;

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
      );
    }

    // Get employee ID from session
    const employeeId = session.user.user_metadata?.employee_id
    if (!employeeId) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid access token - employee ID not found',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const parsedEmployeeId = parseInt(employeeId.toString())
    if (isNaN(parsedEmployeeId)) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 401,
          message: 'Invalid employee ID in token',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    console.log(' Access token verified, employee ID:', parsedEmployeeId);

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
          EmployeeID: parsedEmployeeId,
          fileName: file.name,
          fileType: 'CSV',
          importDate: new Date(),
          status: 'PROCESSING',
          errorCount: 0,
          remarks: `Stock import - ${file.name}`,
          filePath: null
        }
      });
      console.log(' Created importfile record:', importFileRecord.importId);
    } catch (importFileError) {
      console.error(' Failed to create importfile record:', importFileError);
      // Continue with import even if tracking fails - non-critical
    }

    // Parse CSV
    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as StockCsvRow[];

    if (!records.length) {
      // Update importfile record with error status
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
    const requiredColumns = ['productId', 'quantityAvailable'];
    const firstRow = records[0];
    
    for (const col of requiredColumns) {
      if (!(col in firstRow)) {
        // Update importfile record with error status
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

      // Pre-validate all products and variations
      const productIds = new Set<number>();
      const variationIds = new Set<number>();
      
      for (const row of records) {
        const productId = parseInt(row.productId);
        if (!isNaN(productId)) productIds.add(productId);
        
        if (row.variationId) {
          const variationId = parseInt(row.variationId);
          if (!isNaN(variationId)) variationIds.add(variationId);
        }
      }

      // Verify all products exist
      const products = await tx.product.findMany({
        where: {
          productId: { in: Array.from(productIds) },
          deletedAt: null
        },
        select: { productId: true }
      });

      const validProductIds = new Set(products.map(p => p.productId));
      const invalidProductIds = Array.from(productIds).filter(id => !validProductIds.has(id));

      // Verify all variations exist if provided
      let validVariationIds = new Set<number>();
      if (variationIds.size > 0) {
        const variations = await tx.productvariation.findMany({
          where: {
            variationId: { in: Array.from(variationIds) },
            deletedAt: null
          },
          select: { variationId: true }
        });
        validVariationIds = new Set(variations.map(v => v.variationId));
      }

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

        try {
          const productId = parseInt(row.productId);
          const variationId = row.variationId ? parseInt(row.variationId) : null;
          const quantityAvailable = parseInt(row.quantityAvailable);
          const reorderLevel = row.reorderLevel ? parseInt(row.reorderLevel) : null;

          // Validate row data
          if (isNaN(productId) || productId <= 0) {
            errors.push(`Row ${rowNumber}: Invalid productId`);
            continue;
          }

          if (!validProductIds.has(productId)) {
            errors.push(`Row ${rowNumber}: Product ID ${productId} not found`);
            continue;
          }

          if (variationId !== null) {
            if (isNaN(variationId) || variationId <= 0) {
              errors.push(`Row ${rowNumber}: Invalid variationId`);
              continue;
            }
            if (!validVariationIds.has(variationId)) {
              errors.push(`Row ${rowNumber}: Variation ID ${variationId} not found`);
              continue;
            }
          }

          if (isNaN(quantityAvailable) || quantityAvailable < 0) {
            errors.push(`Row ${rowNumber}: Invalid quantityAvailable (must be >= 0)`);
            continue;
          }

          // Find existing stock
          const existingStock = await tx.stock.findFirst({
            where: {
              productId,
              variationId: variationId || null
            }
          });

          let stockUpdate;
          let finalBalance;

          if (existingStock) {
            // Update existing stock
            const quantityBefore = existingStock.quantityAvailable || 0;
            const quantityAfter = quantityAvailable;
            finalBalance = quantityAfter;

            await tx.stock.update({
              where: { stockId: existingStock.stockId },
              data: {
                quantityAvailable: quantityAfter,
                reorderLevel: reorderLevel || existingStock.reorderLevel,
                location: row.location || existingStock.location,
                lastUpdatedDate: new Date()
              }
            });

            stockUpdate = {
              stockId: existingStock.stockId,
              productId,
              variationId,
              quantityBefore,
              quantityAfter,
              action: 'updated'
            };
          } else {
            // Create new stock entry
            const newStock = await tx.stock.create({
              data: {
                productId,
                variationId: variationId || null,
                quantityAvailable: quantityAvailable,
                reorderLevel: reorderLevel || 10, // Default reorder level
                location: row.location || null,
                lastUpdatedDate: new Date()
              }
            });

            finalBalance = quantityAvailable;
            stockUpdate = {
              stockId: newStock.stockId,
              productId,
              variationId,
              quantityBefore: 0,
              quantityAfter: quantityAvailable,
              action: 'created'
            };
          }

          // Create transaction log
          await tx.transactionlog.create({
            data: {
              employeeId: parsedEmployeeId,
              actionType: 'BULK_IMPORT',
              entityName: 'STOCK',
              referenceId: stockUpdate.stockId,
              actionDate: new Date(),
              oldValue: JSON.stringify({
                productId,
                variationId,
                previousQuantity: stockUpdate.quantityBefore
              }),
              newValue: JSON.stringify({
                productId,
                variationId,
                newQuantity: stockUpdate.quantityAfter,
                location: row.location || null,
                reorderLevel: reorderLevel || null
              })
            }
          });

          successes.push(stockUpdate);
          processedCount++;

        } catch (rowError) {
          errors.push(`Row ${rowNumber}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
        }
      }

      // Update importfile record with results (within transaction)
      if (importFileRecord) {
        try {
          await tx.importfile.update({
            where: { importId: importFileRecord.importId },
            data: {
              status: errors.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
              errorCount: errors.length,
              remarks: `Stock import - ${successes.length} successful, ${errors.length} errors`
            }
          });
          console.log(' Updated importfile record with results');
        } catch (updateError) {
          console.error(' Failed to update importfile record:', updateError);
          // Non-critical error, continue
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
      timeout: 30000, // 30 second timeout for large imports
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
          importFileId: result.importFileId, // Include import file ID in response
          summary: {
            created: result.successes.filter(s => s.action === 'created').length,
            updated: result.successes.filter(s => s.action === 'updated').length
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(' Stock Import error:', error);
    
    // Update importfile record with error status if it exists
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
        console.log(' Updated importfile record with error status');
      } catch (updateError) {
        console.error(' Failed to update importfile record with error:', updateError);
      }
    }
    
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Failed to import stock',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}