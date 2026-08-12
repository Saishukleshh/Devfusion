import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';

// 1. POST: Create a product review (Customer-scoped)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { productId, rating, title, comment, images = [] } = await request.json();

    if (!productId || !rating) {
      return NextResponse.json({ error: 'productId and rating (1-5) are required' }, { status: 400 });
    }

    // Ensure rating boundary
    const ratingInt = parseInt(rating, 10);
    if (ratingInt < 1 || ratingInt > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify if purchaser bought this product to set verified badge
    const verifiedPurchase = await prisma.order.findFirst({
      where: {
        userId: auth.user.id,
        status: 'COMPLETED',
        items: {
          some: {
            productVariant: { productId },
          },
        },
      },
    });

    // Create review
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId: auth.user.id,
          productId,
          rating: ratingInt,
          title,
          comment,
          images,
          isVerifiedPurchase: !!verifiedPurchase,
        },
      });

      // Update product rating aggregate metrics
      const productReviews = await tx.review.findMany({
        where: { productId, isActive: true },
        select: { rating: true },
      });

      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = productReviews.length > 0 ? totalRating / productReviews.length : 0;

      await tx.product.update({
        where: { id: productId },
        data: {
          avgRating,
          totalReviews: productReviews.length,
        },
      });

      return newReview;
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Error writing product review:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 2. PATCH: Seller reply to review
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole([Role.SELLER]);

    const { reviewId, reply } = await request.json();

    if (!reviewId || !reply) {
      return NextResponse.json({ error: 'reviewId and reply content are required' }, { status: 400 });
    }

    // Ensure review exists and belongs to the seller's product listing
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: { storeId: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.product.storeId !== auth.store?.id) {
      return NextResponse.json({ error: 'Unauthorized: Review belongs to another store product' }, { status: 403 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        sellerReply: reply,
        sellerRepliedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error('Error replying to review:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
