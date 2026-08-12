import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/rbac';

// 1. GET: Retrieve user's cart
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: auth.user.id },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    name: true,
                    slug: true,
                    price: true,
                    images: true,
                    shippingCharge: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Handle cart auto-generation if not present
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: auth.user.id },
        include: {
          items: {
            include: {
              productVariant: {
                include: {
                  product: {
                    select: {
                      name: true,
                      slug: true,
                      price: true,
                      images: true,
                      shippingCharge: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Compute pricing details in paise
    let subtotal = 0;
    let shippingCharge = 0;

    const items = cart.items.map((item) => {
      const variant = item.productVariant;
      // If variant has an override price, use it; otherwise use default product price
      const price = variant.price !== null ? variant.price : variant.product.price;
      
      if (!item.savedForLater) {
        subtotal += price * item.quantity;
        shippingCharge = Math.max(shippingCharge, variant.product.shippingCharge);
      }

      return {
        id: item.id,
        quantity: item.quantity,
        savedForLater: item.savedForLater,
        variantId: variant.id,
        type: variant.type,
        value: variant.value,
        stock: variant.stock,
        name: variant.product.name,
        slug: variant.product.slug,
        image: variant.images[0] || variant.product.images[0] || '',
        price, // in paise
      };
    });

    // GST default rate 18%
    const gstRate = 0.18;
    const tax = Math.round(subtotal * gstRate);
    const total = subtotal + shippingCharge + tax;

    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        items,
        summary: {
          subtotal,          // paise
          shippingCharge,    // paise
          tax,               // paise
          total,             // paise
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 2. POST: Add item to cart
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { variantId, quantity = 1 } = await request.json();

    if (!variantId) {
      return NextResponse.json({ error: 'productVariantId is required' }, { status: 400 });
    }

    // Check if variant exists and check stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant || !variant.isActive) {
      return NextResponse.json({ error: 'Product variant not found or inactive' }, { status: 404 });
    }

    if (variant.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock available' }, { status: 400 });
    }

    // Get user's cart
    let cart = await prisma.cart.findUnique({
      where: { userId: auth.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: auth.user.id },
      });
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId: variantId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        productVariantId: variantId,
        quantity,
      },
    });

    return NextResponse.json({ success: true, item: cartItem });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 3. PATCH: Update item in cart (quantity or save-for-later status)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { cartItemId, quantity, savedForLater } = await request.json();

    if (!cartItemId) {
      return NextResponse.json({ error: 'cartItemId is required' }, { status: 400 });
    }

    // Ensure item belongs to user's cart
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId: auth.user.id },
      },
      include: { productVariant: true },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    // If changing quantity, validate stock
    if (quantity !== undefined) {
      if (quantity <= 0) {
        // Delete item if quantity is set to 0 or less
        await prisma.cartItem.delete({ where: { id: cartItemId } });
        return NextResponse.json({ success: true, message: 'Item removed from cart' });
      }

      if (cartItem.productVariant.stock < quantity) {
        return NextResponse.json({ error: 'Insufficient stock available' }, { status: 400 });
      }
    }

    // Update fields
    const updated = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(savedForLater !== undefined && { savedForLater }),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 4. DELETE: Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('cartItemId');

    if (!cartItemId) {
      return NextResponse.json({ error: 'cartItemId is required' }, { status: 400 });
    }

    // Ensure item belongs to user's cart
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId: auth.user.id },
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return NextResponse.json({ success: true, message: 'Item removed from cart' });
  } catch (error: any) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
