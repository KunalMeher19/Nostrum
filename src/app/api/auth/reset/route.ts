// POST /api/auth/reset · consumes a reset token and sets the new password.
import { NextResponse } from "next/server";
import { consumeToken } from "@/lib/auth/tokens";
import { setUserPassword } from "@/lib/auth/users";
import { guard } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  const limited = guard(req, "reset");
  if (limited) return limited;

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const token = body.token ?? "";
  const password = body.password ?? "";
  if (password.length < 8) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const userId = token ? await consumeToken(token, "reset-password") : null;
  if (!userId) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  await setUserPassword(userId, password);
  return NextResponse.json({ ok: true });
}
