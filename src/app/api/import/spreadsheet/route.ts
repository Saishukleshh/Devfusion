import { NextRequest, NextResponse } from 'next/server';
import { mapSpreadsheetHeaders } from '@/lib/gemini';
import { requireRole } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER, Role.ADMIN]);

    const { headers, rows } = await request.json();

    if (!headers || !Array.isArray(headers) || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Headers and rows arrays are required' }, { status: 400 });
    }

    // Call LLM ONCE on headers + 2-3 sample rows
    const sampleRows = rows.slice(0, 3);
    const mappingResult = await mapSpreadsheetHeaders(headers, sampleRows);

    // Apply mapping deterministically to ALL rows
    const headerMap = new Map<string, string>();
    mappingResult.mappings.forEach((m) => {
      if (m.mappedField !== 'ignore') {
        headerMap.set(m.originalHeader, m.mappedField);
      }
    });

    const parsedProducts = rows.map((row: Record<string, any>, idx: number) => {
      const prod: any = {
        name: `Imported Product #${idx + 1}`,
        description: '',
        category: 'Fashion',
        brand: auth.store?.name || 'Seller Store',
        priceRupees: 0,
        pricePaise: 0,
        stock: 10,
        variants: [],
        flags: [],
      };

      for (const [origHeader, val] of Object.entries(row)) {
        const mappedField = headerMap.get(origHeader);
        if (!mappedField || val === undefined || val === null) continue;

        const strVal = String(val).trim();

        if (mappedField === 'name') prod.name = strVal;
        else if (mappedField === 'description') prod.description = strVal;
        else if (mappedField === 'category') prod.category = strVal;
        else if (mappedField === 'brand') prod.brand = strVal;
        else if (mappedField === 'sku') prod.sku = strVal;
        else if (mappedField === 'price') {
          const num = parseFloat(strVal.replace(/[^0-9.]/g, ''));
          if (!isNaN(num)) {
            prod.priceRupees = num;
            prod.pricePaise = Math.round(num * 100);
          }
        } else if (mappedField === 'stock') {
          const num = parseInt(strVal.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) prod.stock = num;
        } else if (mappedField === 'variantSize') {
          prod.variants.push({ type: 'size', value: strVal });
        } else if (mappedField === 'variantColor') {
          prod.variants.push({ type: 'color', value: strVal });
        }
      }

      if (prod.priceRupees === 0) {
        prod.flags.push('Price missing or 0 - please verify');
      }

      return prod;
    });

    return NextResponse.json({
      success: true,
      mappings: mappingResult.mappings,
      products: parsedProducts,
    });
  } catch (error: any) {
    console.error('Error in spreadsheet importer API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
