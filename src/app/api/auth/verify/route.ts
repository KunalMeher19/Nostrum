// GET /api/auth/verify?token=... · marks the user's email verified.
import { NextResponse } from "next/server";
import { consumeToken } from "@/lib/auth/tokens";
import { getDb } from "@/lib/auth/mongodb";
import { guard } from "@/lib/auth/rate-limit";

export async function GET(req: Request) {
  const limited = guard(req, "verify");
  if (limited) return limited;

  const token = new URL(req.url).searchParams.get("token") ?? "";
  const base = process.env.AUTH_URL ?? "http://localhost:3000";

  const userId = token ? await consumeToken(token, "verify-email") : null;
  if (!userId) {
    return NextResponse.redirect(`${base}/en/account?verified=0`);
  }

  const db = await getDb();
  await db
    .collection("users")
    .updateOne({ _id: userId }, { $set: { emailVerified: new Date() } });

  return NextResponse.redirect(`${base}/en/account?verified=1`);
}
