// ============================================================
// Auth.js (NextAuth v5) · central configuration
// ------------------------------------------------------------
// - Google OAuth  → users stored via the MongoDB adapter
// - Credentials   → email + password (bcrypt), same users collection
// - Sessions      → JWT (required for credentials), carry id + role.
//   The SAME AUTH_SECRET is shared with the Express backend, which
//   verifies these JWTs for its own API routes.
// - Roles         → "customer" | "admin". Emails in ADMIN_EMAILS are
//   auto-promoted to admin on every sign-in.
// ============================================================
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import clientPromise, { getDb } from "@/lib/auth/mongodb";
import { isAdminEmail, verifyCredentials, type Role } from "@/lib/auth/users";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/en/account", // locale-aware pages redirect as needed
    error: "/en/account",
  },
  providers: [
    Google({
      // Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from env automatically.
      // allowDangerousEmailAccountLinking lets a Google sign-in attach to
      // an existing email+password account with the same address, instead
      // of erroring with OAuthAccountNotLinked. Google verifies emails, so
      // this is safe here and avoids the broken-Google-login failure mode.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        const user = await verifyCredentials(email, password);
        if (!user) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // First sign-in: stamp id + role onto the token.
      if (user) {
        token.uid = (user as { id?: string }).id ?? token.sub;
        token.role = (user as { role?: Role }).role ?? "customer";
      }
      // Admin promotion via ADMIN_EMAILS, checked on sign-in and on
      // session updates so a newly-listed admin doesn't need a new account.
      if ((user || trigger === "update") && token.email && isAdminEmail(token.email)) {
        token.role = "admin";
        try {
          const db = await getDb();
          await db
            .collection("users")
            .updateOne(
              { _id: new ObjectId(String(token.uid ?? token.sub)) },
              { $set: { role: "admin" } }
            );
        } catch {
          // Non-fatal: role still applied to the session token.
        }
      }
      if (!token.role) token.role = "customer";
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.uid ?? token.sub ?? "");
      session.user.role = (token.role as Role) ?? "customer";
      return session;
    },
  },
  events: {
    // OAuth users created by the adapter get defaults stamped in
    // (role, createdAt) since the adapter only writes profile fields.
    async createUser({ user }) {
      if (!user.email || !user.id) return;
      const db = await getDb();
      await db.collection("users").updateOne(
        { _id: new ObjectId(user.id) },
        {
          $set: {
            role: isAdminEmail(user.email) ? "admin" : "customer",
            createdAt: new Date(),
          },
        }
      );
    },
  },
});
