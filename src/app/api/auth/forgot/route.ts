// POST /api/auth/forgot · issues a password-reset token.
// Always returns ok (no account enumeration).
import { NextResponse } from "next/server";
import { findUserByEmail, normalizeEmail } from "@/lib/auth/users";
import { issueToken } from "@/lib/auth/tokens";
import { sendMail } from "@/lib/auth/mailer";
import { guard } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  const limited = guard(req, "forgot");
  if (limited) return limited;

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  if (email) {
    const user = await findUserByEmail(email);
    if (user) {
      const token = await issueToken(user._id, "reset-password");
      const base = process.env.AUTH_URL ?? "http://localhost:3000";
      // Console stub until a provider is wired (src/lib/auth/mailer.ts).
      await sendMail({
        to: email,
        subject: "Reset your Nostrum password",
        text: "Use the link below to choose a new password. It expires in one hour.",
        actionUrl: `${base}/en/account/reset?token=${token}`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
