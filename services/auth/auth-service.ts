import { cookies } from "next/headers";
import type { SessionUser, UserRole } from "@/types";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session-token";

/**
 * Auth abstraction with two implementations:
 *  - DemoAuthService: fixed demo accounts, signed HTTP-only cookie (default).
 *  - SupabaseAuthService: email/password via Supabase Auth; roles from public.profiles.
 *    Google sign-in starts in the browser (supabase.auth.signInWithOAuth) and returns to /auth/callback.
 * Selected by AUTH_PROVIDER=supabase when Supabase keys are present.
 */
export interface AuthService {
  signIn(email: string, password: string): Promise<SessionUser | null>;
  signOut(): Promise<void>;
  getSession(): Promise<SessionUser | null>;
}

export const DEMO_PASSWORD = "demo1234";

export const demoAccounts: (SessionUser & { description: string })[] = [
  { id: "usr_client", name: "Ola Klientka", email: "klient@swoj.pl", role: "client", description: "Klient — rezerwacje i zapytania" },
  { id: "usr_provider", name: "Marek Kowalski", email: "wykonawca@swoj.pl", role: "provider", providerSlug: "marek-kowalski-elektryk-katowice", description: "Specjalista — panel wykonawcy" },
  { id: "usr_admin", name: "Admin SWOJ", email: "admin@swoj.pl", role: "admin", description: "Administrator — panel admina" },
];

async function writeSessionCookie(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

class DemoAuthService implements AuthService {
  async signIn(email: string, password: string) {
    const account = demoAccounts.find((a) => a.email === email.trim().toLowerCase());
    if (!account || password !== DEMO_PASSWORD) return null;
    const { description: _d, ...user } = account;
    void _d;
    await writeSessionCookie(user);
    return user;
  }
  async signOut() {
    (await cookies()).delete(SESSION_COOKIE);
  }
  async getSession() {
    return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  }
}

class SupabaseAuthService implements AuthService {
  async signIn(email: string, password: string) {
    const db = await createSupabaseServerClient();
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error || !data.user) return null;
    return this.toSessionUser(data.user.id, data.user.email ?? email);
  }
  async signOut() {
    const db = await createSupabaseServerClient();
    await db.auth.signOut();
  }
  async getSession() {
    const db = await createSupabaseServerClient();
    const { data } = await db.auth.getUser();
    if (!data.user) return null;
    return this.toSessionUser(data.user.id, data.user.email ?? "");
  }
  private async toSessionUser(id: string, email: string): Promise<SessionUser> {
    const db = await createSupabaseServerClient();
    const { data: profile } = await db.from("profiles").select("full_name, role").eq("id", id).single();
    const { data: provider } = await db.from("providers").select("slug").eq("user_id", id).maybeSingle();
    return {
      id,
      email,
      name: profile?.full_name || email,
      role: (profile?.role as UserRole) ?? "client",
      providerSlug: provider?.slug,
    };
  }
}

let instance: AuthService | null = null;
export function getAuthService(): AuthService {
  instance ??= process.env.AUTH_PROVIDER === "supabase" && isSupabaseConfigured ? new SupabaseAuthService() : new DemoAuthService();
  return instance;
}

export const isDemoAuth = () => !(process.env.AUTH_PROVIDER === "supabase" && isSupabaseConfigured);
