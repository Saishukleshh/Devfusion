import { NextRequest, NextResponse } from 'next/server';
import { extractProductFromWhatsApp } from '@/lib/gemini';
import { requireRole } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER, Role.ADMIN]);

    const { captionText, imageBase64, imageMimeType } = await request.json();

    if (!captionText && !imageBase64) {
      return NextResponse.json({ error: 'At least caption text or product photo is required' }, { status: 400 });
    }

    const extracted = await extractProductFromWhatsApp(captionText || '', imageBase64, imageMimeType);

    // Convert price to paise in application code (₹499 -> 49900 paise)
    const pricePaise = extracted.price ? Math.round(extracted.price * 100) : null;

    return NextResponse.json({
      success: true,
      data: {
        ...extracted,
        pricePaise, // in paise for DB
        priceRupees: extracted.price, // for seller review screen display
      },
    });
  } catch (error: any) {
    console.error('Error in WhatsApp importer API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
