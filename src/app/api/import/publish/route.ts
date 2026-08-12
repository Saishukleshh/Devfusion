import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireVerifiedEmail } from '@/lib/auth/rbac';
import { Role, ActivityType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER, Role.ADMIN]);
    await requireVerifiedEmail(auth);

    if (!auth.store) {
      return NextResponse.json({ error: 'Seller store profile is required to publish products' }, { status: 400 });
    }

    const { products } = await request.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Products array is required' }, { status: 400 });
    }

    // Default category fallback
    const defaultCat = await prisma.category.findFirst({ where: { slug: 'fashion' } });
    const defaultCatId = defaultCat ? defaultCat.id : (await prisma.category.findFirst())?.id;

    if (!defaultCatId) {
      return NextResponse.json({ error: 'No category found in database' }, { status: 400 });
    }

    const published = await prisma.$transaction(async (tx) => {
      const createdProds = [];

      for (const p of products) {
        const baseSlug = (p.name || 'imported-item')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const uniqueSlug = `${baseSlug}-${Math.floor(10000 + Math.random() * 90000)}`;

        // Match category
        let catId = defaultCatId;
        if (p.category) {
          const matchCat = await tx.category.findFirst({
            where: { name: { equals: p.category, mode: 'insensitive' } },
          });
          if (matchCat) catId = matchCat.id;
        }

        const pricePaise = p.pricePaise || (p.priceRupees ? Math.round(p.priceRupees * 100) : 49900);

        const newProd = await tx.product.create({
          data: {
            storeId: auth.store!.id,
            categoryId: catId,
            name: p.name,
            slug: uniqueSlug,
            description: p.description || `${p.name} - Handcrafted quality item.`,
            brand: p.brand || auth.store!.name,
            price: pricePaise,
            images: p.images && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop'],
            sku: p.sku || `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
          },
        });

        // Insert variants
        if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
          for (const v of p.variants) {
            if (v.options && Array.isArray(v.options)) {
              for (const opt of v.options) {
                await tx.productVariant.create({
                  data: {
                    productId: newProd.id,
                    type: v.type || 'variant',
                    value: String(opt),
                    stock: p.suggestedStock || p.stock || 10,
                  },
                });
              }
            } else if (v.value) {
              await tx.productVariant.create({
                data: {
                  productId: newProd.id,
                  type: v.type || 'variant',
                  value: String(v.value),
                  stock: p.suggestedStock || p.stock || 10,
                },
              });
            }
          }
        } else {
          await tx.productVariant.create({
            data: {
              productId: newProd.id,
              type: 'standard',
              value: 'default',
              stock: p.suggestedStock || p.stock || 10,
            },
          });
        }

        // Log creation activity
        await tx.activityLog.create({
          data: {
            userId: auth.user.id,
            type: ActivityType.PRODUCT_CREATED,
            description: `Product "${newProd.name}" imported and published via AI Importer.`,
            entityType: 'Product',
            entityId: newProd.id,
          },
        });

        createdProds.push(newProd);
      }

      return createdProds;
    });

    return NextResponse.json({
      success: true,
      count: published.length,
      products: published,
    });
  } catch (error: any) {
    console.error('Error publishing imported products:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
