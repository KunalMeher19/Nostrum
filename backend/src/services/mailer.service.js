// ============================================================
// Backend mailer · Resend
// ============================================================
// Sends via Resend when RESEND_API_KEY is set; falls back to
// console-logging so local dev works without a key.
//
// From address: once nostrumoils.com is verified in the Resend
// dashboard, update RESEND_FROM env var to "Nostrum <no-reply@nostrumoils.com>".
// Until then, Resend sends from its shared onboarding@resend.dev domain.
// ============================================================
const { Resend } = require('resend');

const RESEND_FROM = process.env.RESEND_FROM || 'Nostrum <onboarding@resend.dev>';

// Where contact-form submissions are relayed.
const CONTACT_INBOX = process.env.CONTACT_INBOX || 'hello@nostrum.local';

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function sendMail({ to, subject, text, html }) {
  const resend = getClient();
  if (!resend) {
    console.log(
      [
        '',
        '==================== NOSTRUM MAIL (console stub — set RESEND_API_KEY to send) ====================',
        `To:      ${to}`,
        `Subject: ${subject}`,
        `Body:    ${text}`,
        '=====================================================================================================',
        '',
      ].join('\n')
    );
    return;
  }

  const body = html || `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a"><p style="font-size:15px;line-height:1.6;white-space:pre-line">${text}</p></div>`;

  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    html: body,
  });

  if (error) {
    console.error('[mailer] Resend error:', error);
    throw new Error(`Mail send failed: ${error.message}`);
  }
}

// Contact form relay: the visitor's message forwarded to the house inbox.
async function sendContactRelay({ name, email, topic, message }) {
  await sendMail({
    to: CONTACT_INBOX,
    subject: `[Nostrum contact · ${topic}] ${name}`,
    text: `From: ${name} <${email}>\nTopic: ${topic}\n\n${message}`,
  });
}

// Newsletter welcome, carrying the tokenized unsubscribe link (GDPR).
async function sendNewsletterWelcome({ email, unsubscribeUrl }) {
  await sendMail({
    to: email,
    subject: 'Welcome to the Nostrum Journal',
    text: `Stories from the grove will reach you here.\nUnsubscribe anytime: ${unsubscribeUrl}`,
  });
}

// Order confirmation. Not reachable from the UI yet (checkout is
// pending the Shopify/Stripe decision); orders.service.createOrder
// calls this so the mail appears the moment checkout lands.
async function sendOrderConfirmation(order) {
  const items = (order.items || [])
    .map((i) => `  ${i.qty} x ${i.productName}${i.sizeLabel ? ` (${i.sizeLabel})` : ''}`)
    .join('\n');
  await sendMail({
    to: order.email,
    subject: `Nostrum order ${order.number} received`,
    text: `Thank you. Your order is with the house.\n\n${items}\n\nTotal: ${order.total} ${order.currency || 'EUR'}`,
  });
}

// Shipping update, sent when the admin marks an order shipped. Carries
// the carrier + tracking link when the admin filled them in.
async function sendShippingUpdate(order) {
  const tracking = order.trackingUrl
    ? `Track it here: ${order.trackingUrl}`
    : order.trackingCode
      ? `Tracking code: ${order.trackingCode}`
      : '';
  const carrier = order.carrier ? `Carrier: ${order.carrier}\n` : '';
  await sendMail({
    to: order.email,
    subject: `Nostrum order ${order.number} is on its way`,
    text: `Your order has left the house.\n\n${carrier}${tracking}`.trimEnd(),
  });
}

module.exports = {
  sendMail,
  sendContactRelay,
  sendNewsletterWelcome,
  sendOrderConfirmation,
  sendShippingUpdate,
};
