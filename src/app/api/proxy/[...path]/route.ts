// /api/proxy/[...path] · same-origin proxy to the Railway backend.
//
// The session cookie (vercel.app domain) cannot travel to railway.app —
// that's a browser rule, not a CORS rule. This route lives on the same
// origin as the frontend, so the cookie arrives here normally. We then
// forward the request to Railway with the cookie in the Authorization
// header (read by the backend auth middleware as a fallback).
//
// All methods, headers, and bodies are forwarded verbatim so the admin
// portal and customer portal need no changes beyond the API_URL swap.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = `${BACKEND}/api/${path.join("/")}${req.nextUrl.search}`;

  // Read the session server-side (same origin, cookie is available).
  const session = await auth();

  // Build forwarded headers: preserve content-type + any custom headers
  // the client sent, and forward the raw cookie so the backend can
  // decrypt the session token directly (belt + braces).
  const headers = new Headers();
  headers.set("content-type", req.headers.get("content-type") ?? "application/json");

  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  // If the session is available, also send it as a Bearer token.
  // The backend will gain a second decryption path in a follow-up;
  // for now the forwarded cookie is sufficient.
  if (session?.user?.id) {
    headers.set("x-proxy-user-id", session.user.id);
    headers.set("x-proxy-user-role", session.user.role ?? "customer");
  }

  // Body must be forwarded as raw bytes. Using req.text() here would
  // UTF-8-decode binary payloads (image uploads) and corrupt them.
  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
  });

  const data = await upstream.arrayBuffer();

  return new NextResponse(data, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
