import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { OrderStatus, PaymentStatus, ActivityType, NotificationType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { 
      orderId, 
      razorpayPaymentId, 
      razorpayOrderId, 
      razorpaySignature 
    } = await request.json();

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing verification parameters' }, { status: 400 });
    }

    // 1. Verify Razorpay Signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Razorpay secret key not configured' }, { status: 500 });
    }

    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      // Mark payment failed in DB
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: 'Invalid payment signature (possible tampering)',
        },
      });
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // 2. Perform atomic stock check and decrement inside a transaction with FOR UPDATE row locks
    const result = await prisma.$transaction(async (tx) => {
      // Fetch order details
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== OrderStatus.PLACED) {
        throw new Error('Order is already processed');
      }

      // Check and update stock atomicity for each variant using raw lock queries
      for (const item of order.items) {
        // Enforce ROW-LEVEL LOCKING (FOR UPDATE)
        const variants: any[] = await tx.$queryRaw`
          SELECT id, stock, "lowStockThreshold"
          FROM "ProductVariant"
          WHERE id = ${item.productVariantId}
          FOR UPDATE
        `;

        const variant = variants[0];
        if (!variant) {
          throw new Error(`Variant not found: ${item.productVariantId}`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`OVERSOLD: Insufficient stock for variant: ${item.productName}`);
        }

        const newStock = variant.stock - item.quantity;

        // Perform decrement
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: newStock },
        });

        // Record stock decrement in ActivityLog (Inventory Audit trail)
        await tx.activityLog.create({
          data: {
            userId: order.userId,
            type: ActivityType.STOCK_OUT,
            description: `Stock decremented by ${item.quantity} due to purchase (Order: ${order.orderNumber})`,
            entityType: 'ProductVariant',
            entityId: item.productVariantId,
            productVariantId: item.productVariantId,
            stockDelta: -item.quantity,
            stockAfter: newStock,
          },
        });

        // Low stock threshold notification trigger
        if (newStock <= variant.lowStockThreshold) {
          // Fetch store detail for notifications
          const product = await tx.productVariant.findUnique({
            where: { id: item.productVariantId },
            include: { product: { include: { store: true } } },
          });

          if (product) {
            await tx.notification.create({
              data: {
                userId: product.product.store.userId,
                type: NotificationType.LOW_STOCK,
                title: 'Low Stock Alert',
                message: `Variant of product ${product.product.name} has fallen below threshold. Current stock: ${newStock}`,
                data: { variantId: item.productVariantId, stock: newStock },
              },
            });
          }
        }
      }

      // Update payment record
      await tx.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.SUCCESS,
          razorpayPaymentId,
          razorpaySignature,
          paidAt: new Date(),
        },
      });

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAYMENT_SUCCESSFUL,
        },
      });

      // Clear user's cart
      const cart = await tx.cart.findUnique({
        where: { userId: order.userId },
      });
      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      // Send payment success notification to customer
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: NotificationType.PAYMENT_SUCCESS,
          title: 'Payment Confirmed',
          message: `Your payment for order ${order.orderNumber} has been verified successfully.`,
          data: { orderId: order.id },
        },
      });

      // Send new order notification to seller
      const store = await tx.store.findUnique({
        where: { id: order.storeId },
      });

      if (store) {
        await tx.notification.create({
          data: {
            userId: store.userId,
            type: NotificationType.NEW_ORDER,
            title: 'New Customer Order',
            message: `Order ${order.orderNumber} has been placed. Please accept and pack the items.`,
            data: { orderId: order.id },
          },
        });
      }

      return updatedOrder;
    });

    return NextResponse.json({ success: true, order: result });
  } catch (error: any) {
    console.error('Error during payment verification:', error);
    return NextResponse.json({ error: error.message || 'Verification Error' }, { status: 500 });
  }
}
