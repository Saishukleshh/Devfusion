import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/rbac';
import { generateInvoicePdf } from '@/lib/invoice';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'orderId query parameter is required' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isCustomer = order.userId === auth.user.id;
    const isSeller = auth.user.role === 'SELLER' && auth.store?.id === order.storeId;

    if (!isCustomer && !isSeller) {
      return NextResponse.json({ error: 'Forbidden: access denied' }, { status: 403 });
    }

    const pdfBuffer = generateInvoicePdf(order);
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Invoice download error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
