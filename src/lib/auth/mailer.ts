// ============================================================
// Mailer · Resend
// ============================================================
// Sends via Resend when RESEND_API_KEY is set; falls back to
// console-logging so local dev works without a key.
//
// From address: once nostrumoils.com is verified in the Resend
// dashboard, update RESEND_FROM below to "Nostrum <no-reply@nostrumoils.com>".
// Until then, Resend sends from its shared onboarding@resend.dev domain.
// ============================================================
import { Resend } from "resend";

const RESEND_FROM = process.env.RESEND_FROM ?? "Nostrum <onboarding@resend.dev>";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  actionUrl: string;
}

export async function sendMail(opts: MailOptions): Promise<void> {
  const resend = getClient();
  if (!resend) {
    console.log(
      [
        "",
        "==================== NOSTRUM MAIL (console stub — set RESEND_API_KEY to send) ====================",
        `To:      ${opts.to}`,
        `Subject: ${opts.subject}`,
        `Body:    ${opts.text}`,
        `Action:  ${opts.actionUrl}`,
        "=====================================================================================================",
        "",
      ].join("\n")
    );
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <p style="font-size:15px;line-height:1.6">${opts.text}</p>
      <p style="margin-top:24px">
        <a href="${opts.actionUrl}"
           style="display:inline-block;padding:12px 24px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:4px;font-size:14px">
          Continue
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#666">
        Or copy this link: ${opts.actionUrl}
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to: opts.to,
    subject: opts.subject,
    html,
  });

  if (error) {
    console.error("[mailer] Resend error:", error);
    throw new Error(`Mail send failed: ${error.message}`);
  }
}
