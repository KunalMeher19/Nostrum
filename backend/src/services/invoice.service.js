// Invoice PDF · generated server-side with pdfkit from the order doc.
// Styled to the brand: warm paper, ink type, one gold hairline, the
// NOSTRUM wordmark set large. No em-dashes anywhere ("·" separators).
const PDFDocument = require('pdfkit');

const INK = '#14160F';
const MUTED = '#6b675c';
const GOLD = '#E6B422';
const PAPER = '#FAF8F2';

function euro(n) {
  return '€' + n.toFixed(2).replace('.', ',');
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Streams an invoice PDF for the given order into `res`. */
function streamInvoice(order, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="nostrum-invoice-${order.number}.pdf"`
  );
  doc.pipe(res);

  const W = doc.page.width; // 595
  const M = 56; // margin

  // Paper wash
  doc.rect(0, 0, W, doc.page.height).fill(PAPER);

  // Wordmark
  doc
    .fillColor(INK)
    .font('Helvetica-Bold')
    .fontSize(34)
    .text('NOSTRUM', M, 64, { characterSpacing: 10 });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED)
    .text('EXTRA VIRGIN OLIVE OIL', M, 104, { characterSpacing: 3 });

  // Invoice meta (right)
  doc
    .fontSize(8)
    .fillColor(MUTED)
    .text('INVOICE', M, 64, { width: W - 2 * M, align: 'right', characterSpacing: 3 });
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(INK)
    .text(order.number, M, 76, { width: W - 2 * M, align: 'right' });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(MUTED)
    .text(fmtDate(order.placedAt), M, 94, { width: W - 2 * M, align: 'right' });

  // Gold hairline
  doc.rect(M, 132, W - 2 * M, 1.2).fill(GOLD);

  // Addresses
  let y = 156;
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
    .text('BILLED TO', M, y, { characterSpacing: 2 });
  doc.text('SOLD BY', W / 2, y, { characterSpacing: 2 });

  const a = order.shippingAddress || {};
  const billLines = [
    a.fullName,
    a.line1,
    a.line2,
    [a.postalCode, a.city].filter(Boolean).join(' '),
    [a.region, a.country].filter(Boolean).join(' · '),
    order.email,
  ].filter(Boolean);
  doc.fontSize(9.5).fillColor(INK);
  let yy = y + 16;
  for (const line of billLines) {
    doc.text(line, M, yy, { width: W / 2 - M - 12 });
    yy += 14;
  }

  // Placeholder legal identity, pending the client's real details.
  const sellerLines = [
    'Nostrum',
    'Company details pending',
    'Spain',
  ];
  let ys = y + 16;
  doc.fillColor(INK);
  for (const line of sellerLines) {
    doc.text(line, W / 2, ys);
    ys += 14;
  }

  // Items table
  y = Math.max(yy, ys) + 36;
  doc.fontSize(8).fillColor(MUTED);
  doc.text('ITEM', M, y, { characterSpacing: 2 });
  doc.text('QTY', W - M - 190, y, { width: 40, align: 'right', characterSpacing: 2 });
  doc.text('UNIT', W - M - 130, y, { width: 55, align: 'right', characterSpacing: 2 });
  doc.text('TOTAL', W - M - 60, y, { width: 60, align: 'right', characterSpacing: 2 });
  y += 12;
  doc.rect(M, y, W - 2 * M, 0.7).fill('#d9d4c7');
  y += 14;

  doc.fontSize(10);
  for (const item of order.items) {
    doc.fillColor(INK).text(`${item.productName} · ${item.sizeLabel}`, M, y, {
      width: W - 2 * M - 200,
    });
    if (item.discount > 0) {
      doc
        .fontSize(8)
        .fillColor(MUTED)
        .text(`Pack discount ${(item.discount * 100).toFixed(0)}%`, M, y + 13);
      doc.fontSize(10);
    }
    doc.fillColor(INK);
    doc.text(`×${item.qty}`, W - M - 190, y, { width: 40, align: 'right' });
    doc.text(euro(item.unitPrice), W - M - 130, y, { width: 55, align: 'right' });
    doc.text(euro(item.lineTotal), W - M - 60, y, { width: 60, align: 'right' });
    y += item.discount > 0 ? 34 : 22;
  }

  y += 6;
  doc.rect(M, y, W - 2 * M, 0.7).fill('#d9d4c7');
  y += 16;

  // Totals
  const label = (txt, val, bold) => {
    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 12 : 9.5)
      .fillColor(bold ? INK : MUTED)
      .text(txt, W - M - 240, y, { width: 150, align: 'right' });
    doc
      .fillColor(INK)
      .text(val, W - M - 80, y, { width: 80, align: 'right' });
    y += bold ? 22 : 17;
  };
  label('Subtotal', euro(order.subtotal));
  label('Shipping', order.shippingCost > 0 ? euro(order.shippingCost) : 'Free');
  label('Total', euro(order.total), true);

  // Footer
  const fy = doc.page.height - 92;
  doc.rect(M, fy, W - 2 * M, 0.7).fill('#d9d4c7');
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED)
    .text(
      'Thank you for keeping the harvest close. Prices are placeholders while the house finalises its catalogue.',
      M,
      fy + 14,
      { width: W - 2 * M }
    );
  doc.text(`Status at issue · ${order.status}`, M, fy + 30);

  doc.end();
}

module.exports = { streamInvoice };
