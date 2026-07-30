// One-time tokens for email verification and password reset.
// Stored hashed (sha256) in the "auth_tokens" collection so a DB leak
// never exposes usable tokens.
import { createHash, randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";

export type TokenKind = "verify-email" | "reset-password";

const TTL_MS: Record<TokenKind, number> = {
  "verify-email": 1000 * 60 * 60 * 24, // 24h
  "reset-password": 1000 * 60 * 60, // 1h
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a token for the user, invalidating previous ones of the same kind. */
export async function issueToken(userId: ObjectId, kind: TokenKind): Promise<string> {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  await db.collection("auth_tokens").deleteMany({ userId, kind });
  await db.collection("auth_tokens").insertOne({
    userId,
    kind,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TTL_MS[kind]),
    createdAt: new Date(),
  });
  return token;
}

/** Consumes a token: returns the userId if valid, null otherwise. Single use. */
export async function consumeToken(
  token: string,
  kind: TokenKind
): Promise<ObjectId | null> {
  const db = await getDb();
  const doc = await db.collection("auth_tokens").findOneAndDelete({
    tokenHash: hashToken(token),
    kind,
    expiresAt: { $gt: new Date() },
  });
  return doc ? (doc.userId as ObjectId) : null;
}
