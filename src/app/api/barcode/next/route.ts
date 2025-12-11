import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyAccessToken } from '@/lib/jwt';
import { getAuthTokenFromCookies } from '@/lib/cookies';

export async function GET(request: NextRequest) {
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

    try {
      verifyAccessToken(accessToken);
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

    const { searchParams } = new URL(request.url);
    const yearMonth = searchParams.get('yearMonth');

    if (!yearMonth) {
      return NextResponse.json(
        { 
          status: 'error',
          code: 400,
          message: 'Year-month parameter is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    try {
      // Find the highest existing barcode for this year-month
      const existingBarcodes = await prisma.productvariation.findMany({
        where: {
          barcode: {
            startsWith: yearMonth,
            not: null
          },
          deletedAt: null
        },
        select: {
          barcode: true
        },
        orderBy: {
          barcode: 'desc'
        },
        take: 1
      });

      let nextNumber = 1;

      if (existingBarcodes.length > 0 && existingBarcodes[0].barcode) {
        // Extract the last 6 digits and increment
        const lastBarcode = existingBarcodes[0].barcode;
        if (lastBarcode.length === 10) {
          const lastNumber = parseInt(lastBarcode.slice(-6));
          nextNumber = lastNumber + 1;
        }
      }

      // Format the next number with leading zeros (6 digits)
      const formattedNumber = nextNumber.toString().padStart(6, '0');
      const newBarcode = `${yearMonth}${formattedNumber}`;

      return NextResponse.json(
        {
          status: 'success',
          code: 200,
          message: 'Next barcode generated successfully',
          timestamp: new Date().toISOString(),
          barcode: newBarcode
        },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          status: 'error',
          code: 500,
          message: 'Failed to generate barcode',
          timestamp: new Date().toISOString(),
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Barcode generation error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        code: 500,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}