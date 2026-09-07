// GET /api/auth/verify?token=... · marks the user's email verified.
import { NextResponse } from "next/server";
import { consumeToken } from "@/lib/auth/tokens";
import { getDb } from "@/lib/auth/mongodb";
import { claimGuestOrdersForUser } from "@/lib/auth/users";
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
  const user = await db.collection("users").findOneAndUpdate(
    { _id: userId },
    { $set: { emailVerified: new Date() } },
    { returnDocument: "after", projection: { email: 1 } }
  );

  if (user?.email) {
    try {
      await claimGuestOrdersForUser(userId, user.email);
    } catch (err) {
      // Verification must still succeed; a later purchase webhook also
      // links verified users, so this can safely be retried there.
      console.error("[auth] failed to claim guest orders after verification:", err);
    }
  }

  return NextResponse.redirect(`${base}/en/account?verified=1`);
}
