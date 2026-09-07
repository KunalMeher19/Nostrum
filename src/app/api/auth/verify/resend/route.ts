import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/auth/mongodb";
import { issueToken } from "@/lib/auth/tokens";
import { sendVerifyEmail } from "@/lib/auth/mailer";
import { guard } from "@/lib/auth/rate-limit";

// POST /api/auth/verify/resend — available only to the signed-in owner.
export async function POST(req: Request) {
  const limited = guard(req, "verify");
  if (limited) return limited;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(userId) },
    { projection: { email: 1, emailVerified: 1 } }
  );
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, verified: true });

  const email = typeof user.email === "string" ? user.email : "";
  if (!email) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  const token = await issueToken(new ObjectId(userId), "verify-email");
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  await sendVerifyEmail(email, `${base}/api/auth/verify?token=${token}`);

  return NextResponse.json({ ok: true });
}
