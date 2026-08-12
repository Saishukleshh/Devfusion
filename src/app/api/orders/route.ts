import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/rbac';
import { OrderStatus, ActivityType, NotificationType } from '@prisma/client';

// 1. GET: Fetch customer orders
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: auth.user.id },
      include: {
        items: {
          include: {
            productVariant: {
              include: { product: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 2. POST: Cancel order (Customer-initiated)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { orderId, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: auth.user.id,
      },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Cancellation check: only permitted before shipment
    const nonCancellableStates: OrderStatus[] = [
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ];

    if (nonCancellableStates.includes(order.status)) {
      return NextResponse.json({
        error: `Order cannot be cancelled because it is already ${order.status.toLowerCase().replace('_', ' ')}`,
      }, { status: 400 });
    }

    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelReason: reason || 'Customer request',
          cancelledAt: new Date(),
        },
      });

      // 2. Restore stock counts for all items (atomic increment)
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        // Log stock increment (Inventory Audit trail)
        await tx.activityLog.create({
          data: {
            userId: auth.user.id,
            type: ActivityType.STOCK_IN,
            description: `Stock restored by ${item.quantity} due to Order Cancellation (${order.orderNumber})`,
            entityType: 'ProductVariant',
            entityId: item.productVariantId,
            productVariantId: item.productVariantId,
            stockDelta: item.quantity,
          },
        });
      }

      // 3. Log order cancellation activity
      await tx.activityLog.create({
        data: {
          userId: auth.user.id,
          type: ActivityType.ORDER_STATUS_CHANGE,
          description: `Order ${order.orderNumber} was cancelled by the customer. Reason: ${reason || 'N/A'}`,
          entityType: 'Order',
          entityId: orderId,
        },
      });

      // 4. Send notification to Seller
      const store = await tx.store.findUnique({
        where: { id: order.storeId },
      });

      if (store) {
        await tx.notification.create({
          data: {
            userId: store.userId,
            type: NotificationType.SYSTEM,
            title: 'Order Cancelled',
            message: `Customer cancelled order ${order.orderNumber}. Reason: ${reason || 'N/A'}. Stock has been restored automatically.`,
            data: { orderId },
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, order: cancelledOrder });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
