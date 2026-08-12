import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { code, subtotal } = await request.json();

    if (!code || subtotal === undefined) {
      return NextResponse.json({ error: 'Missing code or subtotal parameter' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: 'Coupon code is inactive' }, { status: 400 });
    }

    if (coupon.startsAt > new Date()) {
      return NextResponse.json({ error: 'Coupon campaign has not started yet' }, { status: 400 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Coupon code has expired' }, { status: 400 });
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon code usage limit exceeded' }, { status: 400 });
    }

    // Check minimum order value (inputs are in paise)
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      const minValRs = Math.round(coupon.minOrderValue / 100);
      return NextResponse.json({
        error: `Minimum order value to apply this coupon is ₹${minValRs}`,
      }, { status: 400 });
    }

    // Calculate discount amount in paise
    let discount = 0;
    if (coupon.type === 'FLAT') {
      discount = coupon.value;
    } else if (coupon.type === 'PERCENTAGE') {
      discount = Math.round(subtotal * (coupon.value / 100));
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else if (coupon.type === 'FREE_SHIPPING') {
      discount = 0; // Handled dynamically in shipping charge reduction
    }

    // Cap discount to subtotal
    discount = Math.min(discount, subtotal);

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: discount, // in paise
      },
    });
  } catch (error: any) {
    console.error('Error validating coupon API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
