import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { guard } from "@/lib/auth/rate-limit";

export const { GET } = handlers;

// Credentials sign-in posts to /api/auth/callback/credentials — the
// brute-force target (the broken-Google-login incident made auth
// robustness a hard requirement here). Budget failed-or-not attempts
// per IP; every other Auth.js POST (csrf, signout, OAuth callbacks)
// passes straight through.
export async function POST(req: NextRequest): Promise<Response> {
  if (new URL(req.url).pathname.endsWith("/callback/credentials")) {
    const limited = guard(req, "login");
    if (limited) return limited;
  }
  return handlers.POST(req);
}
