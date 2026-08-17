// Invoice PDF · generated server-side with pdfkit from the order doc.
// Styled to the brand: warm paper, ink type, one green hairline, the
// NOSTRUM wordmark set large with the real brand logo beside it.
// No em-dashes anywhere ("·" separators).
const path = require('path');
const PDFDocument = require('pdfkit');

const INK = '#14160F';
const MUTED = '#6b675c';
const GREEN = '#6AAB1E'; // brand olive green (matches the logo mark)
const PAPER = '#FAF8F2';

// Absolute path so it resolves correctly regardless of cwd at runtime.
const LOGO_PATH = path.join(__dirname, '../assets/logo.png');

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

  // ── Header: real brand logo PNG + NOSTRUM wordmark ─────────────
  const LOGO_SIZE = 44;
  const LOGO_X = M;
  const LOGO_Y = 56;

  // Embed the actual brand icon (512×512 PNG, scaled to LOGO_SIZE pt)
  try {
    doc.image(LOGO_PATH, LOGO_X, LOGO_Y, { width: LOGO_SIZE, height: LOGO_SIZE });
  } catch (_) {
    // logo file missing in this environment — skip gracefully
  }

  const wordmarkX = LOGO_X + LOGO_SIZE + 10;
  doc
    .fillColor(INK)
    .font('Helvetica-Bold')
    .fontSize(34)
    .text('NOSTRUM', wordmarkX, LOGO_Y + 4, { characterSpacing: 10 });

  // Invoice meta (right column)
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(MUTED)
    .text('INVOICE', M, LOGO_Y + 4, { width: W - 2 * M, align: 'right', characterSpacing: 3 });
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(INK)
    .text(order.number, M, LOGO_Y + 18, { width: W - 2 * M, align: 'right' });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(MUTED)
    .text(fmtDate(order.placedAt), M, LOGO_Y + 36, { width: W - 2 * M, align: 'right' });

  // Green hairline (brand green, not gold)
  const hairY = LOGO_Y + LOGO_SIZE + 24;
  doc.rect(M, hairY, W - 2 * M, 1.2).fill(GREEN);

  // ── Addresses ───────────────────────────────────────────────────
  // Column widths: left half for BILLED TO, right half for SOLD BY.
  // Each column is capped to W/2 - M - 12 to avoid overlap.
  const COL_W = W / 2 - M - 16; // ~225 pts per column
  const COL_R = W / 2 + 8;      // x-origin of right column

  let y = hairY + 24;
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
    .text('BILLED TO', M, y, { characterSpacing: 2 });
  doc.text('SOLD BY', COL_R, y, { characterSpacing: 2 });

  // Billed-to lines
  const a = order.shippingAddress || {};
  const billLines = [
    a.fullName,
    a.line1,
    a.line2,
    [a.postalCode, a.city].filter(Boolean).join(' '),
    [a.region, a.country].filter(Boolean).join(', '),
    order.email,
  ].filter(Boolean);

  doc.fontSize(9.5).fillColor(INK).font('Helvetica');
  let yBill = y + 16;
  for (const line of billLines) {
    // width cap prevents text bleeding into the SOLD BY column
    doc.text(line, M, yBill, { width: COL_W, lineBreak: false });
    yBill += 14;
  }

  // Sold-by: real legal identity
  const sellerLines = [
    'Oli Gerpifi S.L',
    '43445766B',
    'Poligon Pla de Solans, 22/23',
    'El Perello, 43519, Tarragona',
    'Spain',
  ];
  doc.fontSize(9.5).fillColor(INK).font('Helvetica');
  let ySold = y + 16;
  for (const line of sellerLines) {
    doc.text(line, COL_R, ySold, { width: COL_W, lineBreak: false });
    ySold += 14;
  }

  // ── Items table ─────────────────────────────────────────────────
  // Start after whichever address block is taller, plus some breathing room.
  y = Math.max(yBill, ySold) + 36;

  // Column x-positions for the numeric columns (right-aligned)
  const QTY_X   = W - M - 190;
  const UNIT_X  = W - M - 125;
  const TOTAL_X = W - M - 60;

  doc.fontSize(8).fillColor(MUTED).font('Helvetica');
  doc.text('ITEM',  M,      y, { characterSpacing: 2 });
  doc.text('QTY',   QTY_X,  y, { width: 40,  align: 'right', characterSpacing: 2 });
  doc.text('UNIT',  UNIT_X, y, { width: 55,  align: 'right', characterSpacing: 2 });
  doc.text('TOTAL', TOTAL_X, y, { width: 60, align: 'right', characterSpacing: 2 });
  y += 12;
  doc.rect(M, y, W - 2 * M, 0.7).fill('#d9d4c7');
  y += 14;

  // Item column width: leave room for the three numeric columns + gaps
  const ITEM_W = QTY_X - M - 8;

  doc.fontSize(10).font('Helvetica');
  for (const item of order.items) {
    const rowY = y;
    doc.fillColor(INK).text(`${item.productName} · ${item.sizeLabel}`, M, rowY, {
      width: ITEM_W,
      lineBreak: false,
    });
    if (item.discount > 0) {
      doc.fontSize(8).fillColor(MUTED)
        .text(`Pack discount ${(item.discount * 100).toFixed(0)}%`, M, rowY + 13, {
          width: ITEM_W,
          lineBreak: false,
        });
      doc.fontSize(10).font('Helvetica');
    }
    doc.fillColor(INK);
    doc.text(`×${item.qty}`,          QTY_X,  rowY, { width: 40,  align: 'right', lineBreak: false });
    doc.text(euro(item.unitPrice),    UNIT_X, rowY, { width: 55,  align: 'right', lineBreak: false });
    doc.text(euro(item.lineTotal),    TOTAL_X, rowY, { width: 60, align: 'right', lineBreak: false });
    y += item.discount > 0 ? 34 : 22;
  }

  y += 6;
  doc.rect(M, y, W - 2 * M, 0.7).fill('#d9d4c7');
  y += 16;

  // ── Totals ───────────────────────────────────────────────────────
  const label = (txt, val, bold) => {
    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 12 : 9.5)
      .fillColor(bold ? INK : MUTED)
      .text(txt, W - M - 240, y, { width: 150, align: 'right', lineBreak: false });
    doc
      .fillColor(INK)
      .text(val, W - M - 80, y, { width: 80, align: 'right', lineBreak: false });
    y += bold ? 22 : 17;
  };
  label('Subtotal', euro(order.subtotal));
  label('Shipping', order.shippingCost > 0 ? euro(order.shippingCost) : 'Free');
  label('Total', euro(order.total), true);

  // ── Footer ───────────────────────────────────────────────────────
  const fy = doc.page.height - 80;
  doc.rect(M, fy, W - 2 * M, 0.7).fill('#d9d4c7');
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED)
    .text(`Status at issue · ${order.status}`, M, fy + 16, { width: W - 2 * M });

  doc.end();
}

module.exports = { streamInvoice };
