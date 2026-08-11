// ============================================================
// Backend mailer · Resend
// ============================================================
// Sends via Resend when RESEND_API_KEY is set; falls back to
// console-logging so local dev works without a key.
//
// From address: once nostrumoils.com is verified in the Resend
// dashboard, set RESEND_FROM=Nostrum <no-reply@nostrumoils.com>
// in Railway env vars — no code change needed.
// ============================================================
const { Resend } = require('resend');
const {
  newsletterWelcomeHtml,
  contactRelayHtml,
  orderConfirmationHtml,
  shippingUpdateHtml,
} = require('./email-templates');

const RESEND_FROM = process.env.RESEND_FROM || 'Nostrum <onboarding@resend.dev>';
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

  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error('[mailer] Resend error:', error);
    throw new Error(`Mail send failed: ${error.message}`);
  }
}

async function sendContactRelay({ name, email, topic, message }) {
  await sendMail({
    to: CONTACT_INBOX,
    subject: `[Nostrum contact · ${topic}] ${name}`,
    text: `From: ${name} <${email}>\nTopic: ${topic}\n\n${message}`,
    html: contactRelayHtml({ name, email, topic, message }),
  });
}

async function sendNewsletterWelcome({ email, unsubscribeUrl }) {
  await sendMail({
    to: email,
    subject: 'Welcome to the Nostrum Journal',
    text: `Stories from the grove will reach you here. Unsubscribe: ${unsubscribeUrl}`,
    html: newsletterWelcomeHtml(unsubscribeUrl),
  });
}

async function sendOrderConfirmation(order) {
  await sendMail({
    to: order.email,
    subject: `Nostrum order ${order.number} confirmed`,
    text: `Your order ${order.number} is with the house. Total: ${order.total} ${order.currency || 'EUR'}`,
    html: orderConfirmationHtml(order),
  });
}

async function sendShippingUpdate(order) {
  await sendMail({
    to: order.email,
    subject: `Nostrum order ${order.number} is on its way`,
    text: `Your order has left the house.${order.carrier ? ` Carrier: ${order.carrier}.` : ''}${order.trackingUrl ? ` Track: ${order.trackingUrl}` : order.trackingCode ? ` Code: ${order.trackingCode}` : ''}`,
    html: shippingUpdateHtml(order),
  });
}

module.exports = {
  sendMail,
  sendContactRelay,
  sendNewsletterWelcome,
  sendOrderConfirmation,
  sendShippingUpdate,
};
