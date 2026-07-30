// ============================================================
// Mailer stub · TODO: WIRE A REAL EMAIL PROVIDER LATER
// ============================================================
// Verification and password-reset emails are NOT sent yet. Until the
// client provides an email provider, this module logs the actionable
// link to the server console so flows can be tested end to end.
//
// HOW TO WIRE IT LATER (when the client decides, likely Resend):
//   1. npm install resend
//   2. Set RESEND_API_KEY in .env.local (frontend) and verify the
//      sending domain (e.g. mail.nostrum.com) in the Resend dashboard.
//   3. Replace the console.log below with:
//        import { Resend } from "resend";
//        const resend = new Resend(process.env.RESEND_API_KEY);
//        await resend.emails.send({
//          from: "Nostrum <no-reply@mail.nostrum.com>",
//          to: opts.to,
//          subject: opts.subject,
//          html: opts.html,
//        });
//   4. Build branded HTML templates (dark, minimal, on-brand) for:
//        - verify-email     (link: /api/auth/verify?token=...)
//        - reset-password   (link: /account/reset?token=...)
//   5. Localize subjects/body per the user's locale (messages/*.json).
// ============================================================

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  actionUrl: string;
}

export async function sendMail(opts: MailOptions): Promise<void> {
  // TODO(email): replace with real provider send. See header comment.
  console.log(
    [
      "",
      "==================== NOSTRUM MAIL (console stub) ====================",
      `To:      ${opts.to}`,
      `Subject: ${opts.subject}`,
      `Body:    ${opts.text}`,
      `Action:  ${opts.actionUrl}`,
      "=====================================================================",
      "",
    ].join("\n")
  );
}
