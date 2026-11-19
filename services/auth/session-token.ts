import type { SessionUser } from "@/types";

/**
 * Signed session token for demo auth: base64url(JSON).base64url(HMAC-SHA256).
 * Uses Web Crypto so it runs both in route handlers and in the proxy.
 */
export const SESSION_COOKIE = "swoj_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toBase64Url(new Uint8Array(sig));
}

function getSecret(): string {
  return process.env.AUTH_COOKIE_SECRET || "swoj-demo-secret-change-me-in-production";
}

export async function signSession(user: SessionUser): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ ...user, exp: Date.now() + SESSION_MAX_AGE * 1000 })));
  return `${payload}.${await hmac(getSecret(), payload)}`;
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = await hmac(getSecret(), payload);
  if (expected.length !== signature.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as SessionUser & { exp: number };
    if (data.exp < Date.now()) return null;
    const { exp: _exp, ...user } = data;
    void _exp;
    return user;
  } catch {
    return null;
  }
}
