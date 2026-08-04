// ============================================================
// Backend mailer stub · TODO: WIRE A REAL EMAIL PROVIDER LATER
// ============================================================
// Mirror of src/lib/auth/mailer.ts on the Next.js side. Nothing is
// actually sent yet; every mail is logged to the server console so the
// contact relay, newsletter welcome and order confirmation flows can be
// exercised end to end today and light up unchanged once a provider
// (likely Resend) is wired.
//
// HOW TO WIRE IT LATER (when the client decides, likely Resend):
//   1. npm install resend   (in backend/)
//   2. Set RESEND_API_KEY in backend/.env and verify the sending
//      domain (e.g. mail.nostrum.com) in the Resend dashboard.
//   3. Replace the console.log in sendMail with:
//        const { Resend } = require('resend');
//        const resend = new Resend(process.env.RESEND_API_KEY);
//        await resend.emails.send({
//          from: 'Nostrum <no-reply@mail.nostrum.com>',
//          to: opts.to, subject: opts.subject, html: opts.html,
//        });
//   4. Build branded HTML templates (dark, minimal, on-brand) for:
//        - contact-relay        (to the house inbox)
//        - newsletter-welcome   (with unsubscribe link)
//        - order-confirmation   (number, items, total)
//   5. Localize subjects/body per the recipient's locale.
// ============================================================

// Where contact-form submissions are relayed. Placeholder until the
// client provides the real house inbox.
const CONTACT_INBOX = process.env.CONTACT_INBOX || 'hello@nostrum.local';

async function sendMail({ to, subject, text }) {
  // TODO(email): replace with real provider send. See header comment.
  console.log(
    [
      '',
      '==================== NOSTRUM MAIL (console stub) ====================',
      `To:      ${to}`,
      `Subject: ${subject}`,
      `Body:    ${text}`,
      '=====================================================================',
      '',
    ].join('\n')
  );
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

module.exports = { sendMail, sendContactRelay, sendNewsletterWelcome, sendOrderConfirmation };
