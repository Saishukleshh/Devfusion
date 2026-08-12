import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/rbac';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Enforce Admin role restriction
    const auth = await requireRole([Role.ADMIN]);

    // Query platform stats
    const [
      totalOrders,
      totalUsers,
      totalStores,
      totalProducts,
      recentActivity,
      paymentsSummary,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.store.count(),
      prisma.product.count(),
      // Fetch audit logs
      prisma.activityLog.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
      }),
      // Fetch payments for revenue calculations
      prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        select: { amount: true },
      }),
    ]);

    // Calculate total revenue in paise
    const totalRevenuePaise = paymentsSummary.reduce((acc, curr) => acc + curr.amount, 0);

    // Compute monthly sales aggregates (last 6 months)
    const ordersList = await prisma.order.findMany({
      where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      select: { total: true, createdAt: true },
    });

    const monthlySales: Record<string, number> = {};
    ordersList.forEach((order) => {
      const monthYear = order.createdAt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlySales[monthYear] = (monthlySales[monthYear] || 0) + order.total;
    });

    const formattedMonthlySales = Object.entries(monthlySales).map(([month, total]) => ({
      month,
      revenue: Math.round(total / 100), // convert to Rupees
    })).slice(-6);

    // Categories distribution analytics
    const categoriesList = await prisma.category.findMany({
      include: {
        products: {
          select: {
            totalSold: true,
            price: true,
          },
        },
      },
    });

    const categoryAnalytics = categoriesList.map((cat) => {
      let salesCount = 0;
      let valuePaise = 0;

      cat.products.forEach((p) => {
        salesCount += p.totalSold;
        valuePaise += p.totalSold * p.price;
      });

      return {
        id: cat.id,
        name: cat.name,
        salesCount,
        revenue: Math.round(valuePaise / 100),
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue: Math.round(totalRevenuePaise / 100), // in Rupees
        totalOrders,
        activeSellers: totalStores,
        customersCount: totalUsers,
        productsCount: totalProducts,
      },
      monthlySales: formattedMonthlySales,
      categoryAnalytics,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
