import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categorySlug = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0', 10);
    const maxPrice = parseInt(searchParams.get('maxPrice') || '0', 10);
    const size = searchParams.get('size') || '';
    const color = searchParams.get('color') || '';
    const sort = searchParams.get('sort') || 'latest'; // latest, price-asc, price-desc, popularity, rating
    
    // Pagination parameters
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    // Build filters
    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      isActive: true,
    };

    // 1. Text Search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { store: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // 2. Category Filter
    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    // 3. Brand Filter
    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' };
    }

    // 4. Price range filter (prices stored in paise)
    if (minPrice > 0 || maxPrice > 0) {
      where.price = {};
      if (minPrice > 0) {
        where.price.gte = minPrice * 100; // convert Rupee input to paise
      }
      if (maxPrice > 0) {
        where.price.lte = maxPrice * 100; // convert Rupee input to paise
      }
    }

    // 5. Variant sizes/colors filter
    if (size || color) {
      where.variants = {
        some: {
          isActive: true,
          ...(size && { type: 'size', value: { equals: size, mode: 'insensitive' } }),
          ...(color && { type: 'color', value: { equals: color, mode: 'insensitive' } }),
        },
      };
    }

    // Determine sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'popularity') {
      orderBy = { totalSold: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { avgRating: 'desc' };
    }

    // Query database
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { isActive: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
