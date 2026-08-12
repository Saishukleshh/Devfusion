import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/rbac';
import { razorpay } from '@/lib/razorpay';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { 
      shippingAddressId, 
      billingAddressId, 
      couponCode, 
      notes, 
      paymentMethod = 'RAZORPAY' 
    } = await request.json();

    if (!shippingAddressId) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    // 1. Fetch user's cart items
    const cart = await prisma.cart.findUnique({
      where: { userId: auth.user.id },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 2. Validate stock availability for all items
    for (const item of cart.items) {
      if (item.productVariant.stock < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for ${item.productVariant.product.name} (${item.productVariant.value})`,
        }, { status: 400 });
      }
    }

    // 3. Compute Totals in paise
    let subtotal = 0;
    let shippingCharge = 0;
    const storeId = cart.items[0].productVariant.product.storeId; // Grouped by store

    cart.items.forEach((item) => {
      const price = item.productVariant.price !== null ? item.productVariant.price : item.productVariant.product.price;
      subtotal += price * item.quantity;
      shippingCharge = Math.max(shippingCharge, item.productVariant.product.shippingCharge);
    });

    // Handle coupon application
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.isActive && (coupon.expiresAt === null || coupon.expiresAt > new Date())) {
        if (!coupon.minOrderValue || subtotal >= coupon.minOrderValue) {
          if (coupon.type === 'FLAT') {
            discount = coupon.value;
          } else if (coupon.type === 'PERCENTAGE') {
            discount = Math.round(subtotal * (coupon.value / 100));
            if (coupon.maxDiscount) {
              discount = Math.min(discount, coupon.maxDiscount);
            }
          }
          appliedCoupon = coupon;
        }
      }
    }

    const gstRate = 0.18;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * gstRate);
    const total = taxableAmount + shippingCharge + tax;

    // 4. Create Order & OrderItems in a transaction
    const humanOrderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: humanOrderNumber,
          userId: auth.user.id,
          storeId,
          status: OrderStatus.PLACED,
          subtotal,
          discount,
          shippingCharge,
          tax,
          total,
          couponId: appliedCoupon ? appliedCoupon.id : null,
          shippingAddressId,
          billingAddressId: billingAddressId || shippingAddressId,
          notes,
        },
      });

      // Create Order items snapshot
      await Promise.all(
        cart.items.map((item) => {
          const price = item.productVariant.price !== null ? item.productVariant.price : item.productVariant.product.price;
          return tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productVariantId: item.productVariantId,
              productName: item.productVariant.product.name,
              variantInfo: `${item.productVariant.type.toUpperCase()}: ${item.productVariant.value}`,
              quantity: item.quantity,
              unitPrice: price,
              totalPrice: price * item.quantity,
            },
          });
        })
      );

      return newOrder;
    });

    // 5. Create Payment record & handle payment provider actions
    if (paymentMethod === 'COD') {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: PaymentMethod.COD,
          status: PaymentStatus.PENDING,
          amount: total,
        },
      });

      // Clear Cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return NextResponse.json({
        success: true,
        method: 'COD',
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    }

    // Razorpay Integration
    const rzpOrder = await razorpay.orders.create({
      amount: total, // amount in paise matches Razorpay input format
      currency: 'INR',
      receipt: order.id,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: PaymentMethod.RAZORPAY,
        status: PaymentStatus.PENDING,
        amount: total,
        razorpayOrderId: rzpOrder.id,
      },
    });

    return NextResponse.json({
      success: true,
      method: 'RAZORPAY',
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      keyId: process.env.RAZORPAY_KEY_ID || '',
    });
  } catch (error: any) {
    console.error('Error initiating checkout:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
