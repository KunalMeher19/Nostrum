// User data helpers shared by the credentials provider and the
// register / password-reset API routes. All auth users live in the
// "users" collection, which is the SAME collection the Auth.js
// MongoDB adapter writes Google-OAuth users into, so one email is
// always one account regardless of sign-in method.
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";

export type Role = "customer" | "admin";

export interface DbUser {
  _id: ObjectId;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: Role;
  passwordHash?: string;
  locale?: string;
  gdprConsentAt?: Date;
  marketingConsentAt?: Date;
  createdAt?: Date;
}

const BCRYPT_ROUNDS = 12;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(normalizeEmail(email));
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const db = await getDb();
  return db.collection<DbUser>("users").findOne({ email: normalizeEmail(email) });
}

export async function createCredentialsUser(opts: {
  name: string;
  email: string;
  password: string;
  locale?: string;
  gdprConsent: boolean;
  marketingConsent?: boolean;
}): Promise<DbUser> {
  const db = await getDb();
  const email = normalizeEmail(opts.email);
  const passwordHash = await bcrypt.hash(opts.password, BCRYPT_ROUNDS);
  const doc = {
    _id: new ObjectId(),
    name: opts.name.trim(),
    email,
    emailVerified: null,
    image: null,
    role: (isAdminEmail(email) ? "admin" : "customer") as Role,
    passwordHash,
    locale: opts.locale,
    gdprConsentAt: opts.gdprConsent ? new Date() : undefined,
    marketingConsentAt: opts.marketingConsent ? new Date() : undefined,
    createdAt: new Date(),
  };
  await db.collection("users").insertOne(doc);
  return doc as DbUser;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<DbUser | null> {
  const user = await findUserByEmail(email);
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function setUserPassword(userId: ObjectId, password: string) {
  const db = await getDb();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await db.collection("users").updateOne({ _id: userId }, { $set: { passwordHash } });
}
