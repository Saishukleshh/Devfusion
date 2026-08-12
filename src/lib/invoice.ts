import { Order, OrderItem, Payment } from '@prisma/client';

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function formatCurrency(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function buildTextStream(lines: string[]) {
  const padded = lines.map((line) => `(${escapePdfText(line)}) Tj
0 -18 Td
`).join('');
  return `BT
/F1 12 Tf
50 760 Td
${padded}ET`;
}

export function generateInvoicePdf(order: Order & { items: OrderItem[]; payment: Payment | null }) {
  const lines = [
    'VendorVerse Invoice',
    `Order Number: ${order.orderNumber}`,
    `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`,
    '----------------------------------------',
    `Customer ID: ${order.userId}`,
    `Payment Status: ${order.payment?.status || 'N/A'}`,
    '----------------------------------------',
    'Items:',
  ];

  order.items.forEach((item) => {
    lines.push(`${item.productName} x${item.quantity}`);
    lines.push(`  ${item.variantInfo} | ${formatCurrency(item.unitPrice)} each | ${formatCurrency(item.totalPrice)}`);
  });

  lines.push('----------------------------------------');
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}`);
  lines.push(`Discount: -${formatCurrency(order.discount)}`);
  lines.push(`Shipping: ${formatCurrency(order.shippingCharge)}`);
  lines.push(`Tax: ${formatCurrency(order.tax)}`);
  lines.push('----------------------------------------');
  lines.push(`Total Amount: ${formatCurrency(order.total)}`);
  lines.push('Thank you for shopping with VendorVerse!');

  const contentStream = buildTextStream(lines);
  const streamLength = Buffer.byteLength(contentStream, 'utf8');

  const objects = [] as string[];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n'
  );
  objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  let offset = 0;
  const xrefLines = ['xref', '0 6', '0000000000 65535 f '];
  const body = objects.join('');
  const header = '%PDF-1.3\n';
  offset += Buffer.byteLength(header, 'utf8');

  const objectOffsets = objects.map((obj) => {
    const currentOffset = offset;
    offset += Buffer.byteLength(obj, 'utf8');
    return currentOffset;
  });

  objectOffsets.forEach((objOffset) => {
    xrefLines.push(objOffset.toString().padStart(10, '0') + ' 00000 n ');
  });

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
  const pdf = header + body + xrefLines.join('\n') + '\n' + trailer;
  return Buffer.from(pdf, 'utf8');
}
