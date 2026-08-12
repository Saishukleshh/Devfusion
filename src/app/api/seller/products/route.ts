import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireVerifiedEmail } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';

// POST: Create a product with variants
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER]);
    await requireVerifiedEmail(auth);

    if (!auth.store) {
      return NextResponse.json({ error: 'Store profile not created yet' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      categoryId,
      categorySlug,
      brand,
      images = [],
      video,
      sku,
      barcode,
      price, // in Rupees (will convert to paise)
      discount = 0,
      weight,
      dimensions,
      shippingCharge = 0, // in Rupees (will convert to paise)
      variants = [], // array of { type: string, value: string, stock: number }
      tags = [],
    } = body;

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (!category) {
        return NextResponse.json({ error: `Category slug '${categorySlug}' not found` }, { status: 400 });
      }
      resolvedCategoryId = category.id;
    }

    if (!name || !description || !resolvedCategoryId || !price) {
      return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });
    }

    // Generate slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const productPricePaise = Math.round(parseFloat(price) * 100);
    const shippingChargePaise = Math.round(parseFloat(shippingCharge) * 100);

    const product = await prisma.$transaction(async (tx) => {
      // 1. Create product
      const newProduct = await tx.product.create({
        data: {
          storeId: auth.store!.id,
          categoryId: resolvedCategoryId,
          name,
          slug: uniqueSlug,
          description,
          brand,
          images,
          video,
          sku,
          barcode,
          price: productPricePaise,
          discount,
          weight: weight ? parseFloat(weight) : null,
          dimensions,
          shippingCharge: shippingChargePaise,
          tags,
        },
      });

      // 2. Create variants
      if (variants && variants.length > 0) {
        await Promise.all(
          variants.map((v: any) =>
            tx.productVariant.create({
              data: {
                productId: newProduct.id,
                type: v.type || 'custom',
                value: v.value,
                stock: parseInt(v.stock, 10) || 0,
                lowStockThreshold: parseInt(v.lowStockThreshold, 10) || 5,
              },
            })
          )
        );
      } else {
        // Create one default single variant if none provided
        await tx.productVariant.create({
          data: {
            productId: newProduct.id,
            type: 'standard',
            value: 'default',
            stock: 0,
          },
        });
      }

      // Record activity
      await tx.activityLog.create({
        data: {
          userId: auth.user.id,
          type: 'PRODUCT_CREATED',
          description: `Product "${name}" created with variants.`,
          entityType: 'Product',
          entityId: newProduct.id,
        },
      });

      return newProduct;
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Error creating seller product:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
