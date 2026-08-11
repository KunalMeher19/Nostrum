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
import { verifyEmailHtml, resetPasswordHtml } from "./email-templates";

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
  /** Pass a pre-built branded HTML body to skip the default template. */
  html?: string;
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

  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html ?? verifyEmailHtml(opts.actionUrl),
  });

  if (error) {
    console.error("[mailer] Resend error:", error);
    throw new Error(`Mail send failed: ${error.message}`);
  }
}

/** Verify-email flow — called from /api/auth/register */
export async function sendVerifyEmail(to: string, actionUrl: string): Promise<void> {
  return sendMail({
    to,
    subject: "Confirm your Nostrum account",
    text: "Welcome to Nostrum. Confirm your email to complete your account.",
    actionUrl,
    html: verifyEmailHtml(actionUrl),
  });
}

/** Password-reset flow — called from /api/auth/forgot */
export async function sendResetPassword(to: string, actionUrl: string): Promise<void> {
  return sendMail({
    to,
    subject: "Reset your Nostrum password",
    text: "Use the link below to choose a new password. It expires in one hour.",
    actionUrl,
    html: resetPasswordHtml(actionUrl),
  });
}
