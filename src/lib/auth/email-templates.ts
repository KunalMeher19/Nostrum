// ============================================================
// Nostrum · branded email templates
// Dark luxury — ink-black bg, gold accent, off-white text.
// All emails share one shell; each type supplies its own body.
// Inline styles only (email client compatibility).
// ============================================================

const BG = "#14160F";
const CARD_BG = "#1E2A16";
const GOLD = "#E6B422";
const TEXT = "#EDEBE3";
const MUTED = "#8A8878";
const BORDER = "#2C2C22";

function shell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>Nostrum</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <!-- Logo -->
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <span style="font-size:28px;font-weight:700;letter-spacing:0.25em;color:${TEXT};text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">NOSTRUM</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:${CARD_BG};border:1px solid ${BORDER};border-radius:4px;padding:48px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;">
                Extra virgin olive oil, Catalonia, Spain.<br/>
                &copy;${new Date().getFullYear()} Nostrum
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
    <tr>
      <td style="background:${GOLD};border-radius:2px;">
        <a href="${url}"
           style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;letter-spacing:0.08em;color:#0D0F09;text-decoration:none;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 16px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${GOLD};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${text}</p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 20px;font-size:26px;font-weight:600;line-height:1.25;color:${TEXT};letter-spacing:-0.01em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${text}</h1>`;
}

function body(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${TEXT};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BORDER};margin:32px 0;" />`;
}

function smallLink(label: string, url: string): string {
  return `<p style="margin:16px 0 0;font-size:12px;color:${MUTED};word-break:break-all;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    Or copy this link:<br/>
    <a href="${url}" style="color:${MUTED};text-decoration:underline;">${url}</a>
  </p>`;
}

// ── Template: verify email ──────────────────────────────────

export function verifyEmailHtml(actionUrl: string): string {
  return shell(`
    ${eyebrow("Account")}
    ${heading("Confirm your email")}
    ${body("Welcome to Nostrum. One step left — confirm your address to complete your account.")}
    ${ctaButton("Confirm email", actionUrl)}
    ${divider()}
    <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      This link expires in 24 hours. If you did not create a Nostrum account, you can ignore this email.
    </p>
    ${smallLink("Confirm email", actionUrl)}
  `);
}

// ── Template: reset password ───────────────────────────────

export function resetPasswordHtml(actionUrl: string): string {
  return shell(`
    ${eyebrow("Account")}
    ${heading("Reset your password")}
    ${body("Use the button below to choose a new password. The link expires in one hour.")}
    ${ctaButton("Choose new password", actionUrl)}
    ${divider()}
    <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      If you did not request a password reset, no action is needed — your account is safe.
    </p>
    ${smallLink("Choose new password", actionUrl)}
  `);
}

// ── Template: newsletter welcome ──────────────────────────

export function newsletterWelcomeHtml(unsubscribeUrl: string): string {
  return shell(`
    ${eyebrow("Journal")}
    ${heading("Stories from the grove")}
    ${body("You are now part of a small circle that hears from us first — harvests, tastings, the life of the land.")}
    ${body("We write when there is something worth saying. No noise.")}
    ${divider()}
    <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      Changed your mind? <a href="${unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a> at any time.
    </p>
  `);
}

// ── Template: contact relay (internal, to house inbox) ────

export interface ContactRelayData {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export function contactRelayHtml(data: ContactRelayData): string {
  return shell(`
    ${eyebrow("Contact form")}
    ${heading(`Message from ${data.name}`)}
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;font-size:13px;color:${MUTED};width:80px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">From</td>
        <td style="padding:4px 0;font-size:13px;color:${TEXT};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${data.name} &lt;${data.email}&gt;</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:13px;color:${MUTED};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Topic</td>
        <td style="padding:4px 0;font-size:13px;color:${TEXT};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${data.topic}</td>
      </tr>
    </table>
    ${divider()}
    <p style="margin:0;font-size:15px;line-height:1.7;color:${TEXT};white-space:pre-line;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${data.message}</p>
  `);
}

// ── Template: order confirmation ──────────────────────────

export interface OrderItem {
  qty: number;
  productName: string;
  sizeLabel?: string;
  unitPrice?: number;
}

export interface OrderConfirmationData {
  number: string;
  items: OrderItem[];
  total: number;
  currency?: string;
  email: string;
}

function orderItemsTable(items: OrderItem[], currency: string): string {
  const rows = items.map((i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        ${i.productName}${i.sizeLabel ? ` <span style="color:${MUTED}">(${i.sizeLabel})</span>` : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${MUTED};text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">×${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT};text-align:right;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        ${i.unitPrice != null ? `${(i.unitPrice * i.qty).toFixed(2)} ${currency}` : ""}
      </td>
    </tr>
  `).join("");

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0;">
      <tr>
        <th style="padding:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};text-align:left;font-weight:400;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Product</th>
        <th style="padding:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};text-align:center;font-weight:400;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Qty</th>
        <th style="padding:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};text-align:right;font-weight:400;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Total</th>
      </tr>
      ${rows}
      <tr>
        <td colspan="2" style="padding:14px 0 0;font-size:13px;color:${MUTED};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Order total</td>
        <td style="padding:14px 0 0;font-size:16px;font-weight:600;color:${GOLD};text-align:right;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${items[0] != null ? `${Number(0).toFixed(2)}` : ""}</td>
      </tr>
    </table>
  `;
}

export function orderConfirmationHtml(order: OrderConfirmationData): string {
  const currency = order.currency ?? "EUR";
  const rows = order.items.map((i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        ${i.productName}${i.sizeLabel ? ` <span style="color:${MUTED}">(${i.sizeLabel})</span>` : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${MUTED};text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">×${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${TEXT};text-align:right;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        ${i.unitPrice != null ? `${(i.unitPrice * i.qty).toFixed(2)} ${currency}` : ""}
      </td>
    </tr>
  `).join("");

  return shell(`
    ${eyebrow("Order confirmed")}
    ${heading("Your order is with the house.")}
    ${body(`Order <strong style="color:${GOLD}">${order.number}</strong> — we will be in touch when it ships.`)}
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0;">
      <tr>
        <th style="padding:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};text-align:left;font-weight:400;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Product</th>
        <th style="padding:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};text-align:center;font-weight:400;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Qty</th>
        <th style="padding:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};text-align:right;font-weight:400;font-family:'Helvetice Neue',Helvetica,Arial,sans-serif;">Total</th>
      </tr>
      ${rows}
      <tr>
        <td colspan="2" style="padding:14px 0 0;font-size:13px;color:${MUTED};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Order total</td>
        <td style="padding:14px 0 0;font-size:16px;font-weight:600;color:${GOLD};text-align:right;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${order.total.toFixed(2)} ${currency}</td>
      </tr>
    </table>
    ${divider()}
    <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      Questions? Reply to this email or reach us at <a href="mailto:office@nostrumoils.com" style="color:${MUTED};text-decoration:underline;">office@nostrumoils.com</a>
    </p>
  `);
}

// ── Template: shipping update ─────────────────────────────

export interface ShippingUpdateData {
  number: string;
  carrier?: string;
  trackingCode?: string;
  trackingUrl?: string;
}

export function shippingUpdateHtml(order: ShippingUpdateData): string {
  const trackingBlock = order.trackingUrl
    ? ctaButton("Track your order", order.trackingUrl)
    : order.trackingCode
      ? `<p style="margin:24px 0;font-size:14px;color:${TEXT};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Tracking code: <strong style="color:${GOLD}">${order.trackingCode}</strong></p>`
      : "";

  const carrierLine = order.carrier
    ? `<p style="margin:0 0 8px;font-size:14px;color:${MUTED};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Carrier: ${order.carrier}</p>`
    : "";

  return shell(`
    ${eyebrow("Shipping")}
    ${heading("Your order is on its way.")}
    ${body(`Order <strong style="color:${GOLD}">${order.number}</strong> has left the grove and is heading to you.`)}
    ${carrierLine}
    ${trackingBlock}
    ${divider()}
    <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      Questions? Reply to this email or reach us at <a href="mailto:office@nostrumoils.com" style="color:${MUTED};text-decoration:underline;">office@nostrumoils.com</a>
    </p>
  `);
}
