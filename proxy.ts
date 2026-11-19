import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/services/auth/session-token";

/**
 * Route protection (Next.js 16 "proxy", formerly middleware).
 * First line of defence only — layouts of /panel and /admin re-check the role on the server.
 */
const rules: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/panel", roles: ["provider", "admin"] },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = rules.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!rule) return NextResponse.next();

  // With Supabase Auth the session lives in sb-* cookies; the layout performs the role check.
  if (process.env.AUTH_PROVIDER === "supabase") return NextResponse.next();

  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user || !rule.roles.includes(user.role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/logowanie";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/admin/:path*"],
};
