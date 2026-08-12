import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireVerifiedEmail } from '@/lib/auth/rbac';
import { Role, OrderStatus, ActivityType, NotificationType } from '@prisma/client';

// 1. GET: Fetch orders for seller store
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER]);

    if (!auth.store) {
      return NextResponse.json({ error: 'Store profile not created yet' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    const orders = await prisma.order.findMany({
      where: {
        storeId: auth.store.id,
        ...(status && { status: status as OrderStatus }),
      },
      include: {
        items: {
          include: {
            productVariant: {
              include: { product: true },
            },
          },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 2. PATCH: Update order status (State machine transitions)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER]);
    await requireVerifiedEmail(auth);

    if (!auth.store) {
      return NextResponse.json({ error: 'Store profile not created yet' }, { status: 400 });
    }

    const { 
      orderId, 
      status, 
      courierPartner, 
      trackingNumber, 
      estimatedDelivery 
    } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    // Ensure order belongs to seller's store
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId: auth.store.id,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate state machine transitions
    // PLACED -> PAYMENT_SUCCESSFUL (via payment api) -> ACCEPTED -> PACKED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED -> COMPLETED
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PLACED]: [OrderStatus.CANCELLED],
      [OrderStatus.PAYMENT_SUCCESSFUL]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
      [OrderStatus.PACKED]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUND_REQUESTED]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: [],
    };

    const nextStatus = status as OrderStatus;
    const validNextStates = allowedTransitions[order.status] || [];

    if (!validNextStates.includes(nextStatus)) {
      return NextResponse.json({
        error: `Invalid status transition from ${order.status} to ${nextStatus}`,
      }, { status: 400 });
    }

    // Perform update in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {
        status: nextStatus,
        ...(courierPartner && { courierPartner }),
        ...(trackingNumber && { trackingNumber }),
        ...(estimatedDelivery && { estimatedDelivery: new Date(estimatedDelivery) }),
        ...(nextStatus === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
      };

      const updated = await tx.order.update({
        where: { id: orderId },
        data: dataToUpdate,
      });

      // Log status transition in ActivityLog
      await tx.activityLog.create({
        data: {
          userId: auth.user.id,
          type: ActivityType.ORDER_STATUS_CHANGE,
          description: `Order ${order.orderNumber} status changed from ${order.status} to ${nextStatus}`,
          entityType: 'Order',
          entityId: orderId,
        },
      });

      // Send notifications to Customer
      let notificationTitle = 'Order Update';
      let notificationMsg = `Your order ${order.orderNumber} is now ${nextStatus.toLowerCase().replace('_', ' ')}.`;

      if (nextStatus === OrderStatus.ACCEPTED) {
        notificationTitle = 'Order Accepted';
        notificationMsg = `Good news! Seller has accepted your order ${order.orderNumber} and is preparing it.`;
      } else if (nextStatus === OrderStatus.SHIPPED) {
        notificationTitle = 'Order Shipped';
        notificationMsg = `Your order ${order.orderNumber} has been shipped via ${courierPartner || 'our partner'}. Tracking ID: ${trackingNumber || 'N/A'}`;
      } else if (nextStatus === OrderStatus.DELIVERED) {
        notificationTitle = 'Order Delivered';
        notificationMsg = `Your order ${order.orderNumber} has been delivered successfully.`;
      }

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: nextStatus === OrderStatus.SHIPPED ? NotificationType.ORDER_SHIPPED : NotificationType.ORDER_DELIVERED,
          title: notificationTitle,
          message: notificationMsg,
          data: { orderId, status: nextStatus },
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating seller order status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
