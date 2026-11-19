import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** OAuth (Google) return URL for Supabase Auth: exchanges the code for a session cookie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && isSupabaseConfigured) {
    const db = await createSupabaseServerClient();
    await db.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/konto", url.origin));
}
