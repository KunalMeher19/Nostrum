// POST /api/auth/register · email + password signup with GDPR consent.
import { NextResponse } from "next/server";
import {
  createCredentialsUser,
  findUserByEmail,
  normalizeEmail,
} from "@/lib/auth/users";
import { issueToken } from "@/lib/auth/tokens";
import { sendVerifyEmail } from "@/lib/auth/mailer";
import { guard } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  const limited = guard(req, "register");
  if (limited) return limited;

  let body: {
    name?: string;
    email?: string;
    password?: string;
    locale?: string;
    gdprConsent?: boolean;
    marketingConsent?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";

  if (!name || name.length > 120) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }
  if (!body.gdprConsent) {
    // GDPR: consent is required to create an account.
    return NextResponse.json({ error: "consent_required" }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const user = await createCredentialsUser({
    name,
    email,
    password,
    locale: body.locale,
    gdprConsent: true,
    marketingConsent: !!body.marketingConsent,
  });

  // Non-blocking verification: the customer is signed in immediately, while
  // email ownership is required only for sensitive actions such as claiming
  // historical guest orders.
  const token = await issueToken(user._id, "verify-email");
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  try {
    await sendVerifyEmail(email, `${base}/api/auth/verify?token=${token}`);
  } catch (err) {
    // Account creation and sign-in must not fail because email delivery is
    // temporarily unavailable. The signed-in account panel offers resend.
    console.error("[auth] failed to send verification email:", err);
  }

  return NextResponse.json({ ok: true });
}
