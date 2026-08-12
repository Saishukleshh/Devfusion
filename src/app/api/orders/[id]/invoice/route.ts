import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify access
    if (order.userId !== auth.user.id && auth.user.role !== 'ADMIN') {
      const store = await prisma.store.findUnique({ where: { id: order.storeId } });
      if (!store || store.userId !== auth.user.id) {
        return NextResponse.json({ error: 'Unauthorized to view invoice' }, { status: 403 });
      }
    }

    const store = await prisma.store.findUnique({ where: { id: order.storeId } });

    const formatPrice = (p: number) => (p / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    // Generate Invoice HTML representation
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${order.orderNumber}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #000; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .section { margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
          th { background: #f9f9f9; text-transform: uppercase; font-size: 11px; }
          .total-box { margin-top: 20px; text-align: right; font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2>TAX INVOICE</h2>
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div style="text-align: right;">
            <h3>${store?.name || 'VendorVerse Store'}</h3>
            <p>${store?.city || 'India'}, GST: ${store?.gstNumber || 'GST-PENDING'}</p>
          </div>
        </div>

        <div class="section">
          <h4>Billed To:</h4>
          <p><strong>${order.user.name}</strong> (${order.user.email})</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((i) => `
              <tr>
                <td>${i.productName}</td>
                <td>${i.variantInfo}</td>
                <td>${i.quantity}</td>
                <td>${formatPrice(i.unitPrice)}</td>
                <td>${formatPrice(i.totalPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-box">
          <p>Subtotal: ${formatPrice(order.subtotal)}</p>
          <p>Discount: -${formatPrice(order.discount)}</p>
          <p>GST (18%): ${formatPrice(order.tax)}</p>
          <p>Shipping: ${formatPrice(order.shippingCharge)}</p>
          <hr />
          <h3>Grand Total: ${formatPrice(order.total)}</h3>
          <p style="font-size: 11px; color: #666;">Payment Status: ${order.payment?.status || 'PAID'}</p>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
