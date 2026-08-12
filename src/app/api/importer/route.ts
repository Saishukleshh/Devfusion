import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireVerifiedEmail } from '@/lib/auth/rbac';
import { Role, ActivityType } from '@prisma/client';
import { ParsedItem, parseImporterInput } from '@/lib/aiImporter';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => item?.toString().trim()).filter(Boolean);
  }
  return value
    .toString()
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalizeItem(raw: any): ParsedItem | null {
  if (!raw || typeof raw !== 'object') return null;

  const name = raw.name || raw.title || raw.itemName || raw['Item Name'] || raw['item name'] || '';
  if (!name || typeof name !== 'string') return null;

  const categoryRaw =
    raw.category || raw.categorySlug || raw.category_name || raw['category name'] || raw['product category'] || '';

  return {
    name: name.toString().trim(),
    description: (raw.description || raw.desc || raw.details || '').toString().trim(),
    categorySlug: slugify(categoryRaw.toString()),
    brand: (raw.brand || raw.manufacturer || '').toString().trim(),
    price: Math.max(0, parseFloat(raw.price ?? raw.cost ?? raw.mrp ?? '0') || 0),
    discount: Math.max(0, Math.min(100, parseInt(raw.discount ?? raw.discountPercent ?? raw.discountpercent ?? '0', 10) || 0)),
    stock: Math.max(0, parseInt(raw.stock ?? raw.quantity ?? raw.qty ?? '0', 10) || 0),
    tags: normalizeArray(raw.tags || raw.keywords || raw.categories),
    images: normalizeArray(raw.images || raw.image || raw.photo || raw.photos),
  };
}

async function resolveImporterItems(rawText: string, incomingItems: unknown[] | undefined, action: string): Promise<ParsedItem[]> {
  let items: ParsedItem[] = [];

  if (action !== 'preview' && Array.isArray(incomingItems) && incomingItems.length > 0) {
    items = incomingItems
      .map(normalizeItem)
      .filter((item): item is ParsedItem => item !== null);
  }

  if (!items.length) {
    items = await parseImporterInput(rawText);
  }

  return items;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER]);
    await requireVerifiedEmail(auth);

    if (!auth.store) {
      return NextResponse.json({ error: 'Seller store profile is required' }, { status: 400 });
    }

    const requestBody = await request.json();
    const rawText = requestBody.rawText ?? '';
    const action = requestBody.action ?? 'preview';
    const incomingItems = Array.isArray(requestBody.items) ? requestBody.items : undefined;

    const items = await resolveImporterItems(rawText, incomingItems, action);
    if (!items.length) {
      return NextResponse.json({ error: 'No products could be parsed from the importer input' }, { status: 400 });
    }

    const parsedItems = items.map((item, index) => ({
      id: `item-${index + 1}`,
      ...item,
      categorySlug: item.categorySlug || 'supplies',
      price: item.price || 0,
      discount: item.discount || 0,
      stock: item.stock || 0,
    }));

    if (action === 'preview') {
      return NextResponse.json({ success: true, items: parsedItems });
    }

    const createdProducts = await prisma.$transaction(async (tx) => {
      const storeId = auth.store!.id;
      const productResults: Array<{ id: string; name: string; slug: string }> = [];

      for (const item of parsedItems) {
        if (!item.name.trim()) continue;

        let category = await tx.category.findUnique({ where: { slug: item.categorySlug } });
        if (!category) {
          category = await tx.category.create({
            data: {
              name: item.categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (chr) => chr.toUpperCase()),
              slug: item.categorySlug || 'supplies',
              description: `Auto-generated category for ${item.categorySlug}`,
            },
          });
        }

        const productSlug = `${slugify(item.name)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const product = await tx.product.create({
          data: {
            storeId,
            categoryId: category.id,
            name: item.name,
            slug: productSlug,
            description: item.description || 'Imported product listing from supplier notes.',
            brand: item.brand || 'Generic',
            images:
              item.images.length > 0
                ? item.images
                : ['https://images.unsplash.com/photo-1553456558-aff63285bdd0?q=80&w=1200&auto=format&fit=crop'],
            price: Math.round(item.price * 100),
            discount: item.discount,
            shippingCharge: 0,
            tags: item.tags,
          },
        });

        await tx.productVariant.create({
          data: {
            productId: product.id,
            type: 'default',
            value: 'standard',
            stock: item.stock,
            lowStockThreshold: Math.max(1, Math.min(item.stock, 5)),
            images: product.images,
          },
        });

        await tx.activityLog.create({
          data: {
            userId: auth.user.id,
            type: ActivityType.PRODUCT_CREATED,
            description: `Imported product '${item.name}' using AI importer.`,
            entityType: 'Product',
            entityId: product.id,
          },
        });

        productResults.push({ id: product.id, name: product.name, slug: product.slug });
      }

      return productResults;
    });

    return NextResponse.json({ success: true, createdProducts });
  } catch (error: any) {
    console.error('Error in importer:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
