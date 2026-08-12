import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireVerifiedEmail } from '@/lib/auth/rbac';
import { Role, ActivityType, NotificationType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER]);

    if (!auth.store) {
      return NextResponse.json({ error: 'Store profile not created yet' }, { status: 400 });
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        product: { storeId: auth.store.id },
        isActive: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, variants });
  } catch (error: any) {
    console.error('Error fetching seller inventory:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER]);
    await requireVerifiedEmail(auth);

    if (!auth.store) {
      return NextResponse.json({ error: 'Store profile not created yet' }, { status: 400 });
    }

    const { 
      variantId, 
      stock, 
      lowStockThreshold, 
      restockEta, 
      restockNote 
    } = await request.json();

    if (!variantId) {
      return NextResponse.json({ error: 'variantId is required' }, { status: 400 });
    }

    // Ensure variant belongs to seller's store
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        product: { storeId: auth.store.id },
      },
      include: { product: true },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Product variant not found in your store' }, { status: 404 });
    }

    const oldStock = variant.stock;
    const newStock = stock !== undefined ? parseInt(stock, 10) : oldStock;

    // 1. Perform variant updates
    const updatedVariant = await prisma.$transaction(async (tx) => {
      // Setup payload
      const dataToUpdate: any = {
        ...(stock !== undefined && { stock: newStock }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold, 10) }),
        // If stock is replenished above 0, auto-clear restock estimates
        ...(newStock > 0 ? { restockEta: null, restockNote: null } : {
          restockEta: restockEta ? new Date(restockEta) : variant.restockEta,
          restockNote: restockNote !== undefined ? restockNote : variant.restockNote,
        }),
      };

      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: dataToUpdate,
      });

      // Write activity log audit trail
      if (stock !== undefined && oldStock !== newStock) {
        const delta = newStock - oldStock;
        await tx.activityLog.create({
          data: {
            userId: auth.user.id,
            type: ActivityType.STOCK_ADJUSTMENT,
            description: `Manual stock adjustment: ${oldStock} -> ${newStock} (Delta: ${delta >= 0 ? '+' : ''}${delta})`,
            entityType: 'ProductVariant',
            entityId: variantId,
            productVariantId: variantId,
            stockDelta: delta,
            stockAfter: newStock,
          },
        });
      }

      // 2. Trigger Back-in-Stock Notifications if stock transitions from 0 to positive
      if (oldStock === 0 && newStock > 0) {
        // Query users who have this product in their wishlist
        const wishlists = await tx.wishlist.findMany({
          where: { productId: variant.productId },
          select: { userId: true },
        });

        // Trigger notifications
        if (wishlists.length > 0) {
          await Promise.all(
            wishlists.map((w) =>
              tx.notification.create({
                data: {
                  userId: w.userId,
                  type: NotificationType.BACK_IN_STOCK,
                  title: 'Back in Stock!',
                  message: `${variant.product.name} is now available in your size/color. Grab yours now!`,
                  data: { productId: variant.productId, variantId },
                },
              })
            )
          );
        }
      }

      return updated;
    });

    return NextResponse.json({ success: true, variant: updatedVariant });
  } catch (error: any) {
    console.error('Error updating seller inventory:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
