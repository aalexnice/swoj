import { NextResponse } from "next/server";
import { getAuthService } from "@/services/auth/auth-service";
import { assertSameOrigin, parseJson, rateLimit } from "@/lib/api";
import { loginSchema } from "@/validation/schemas";

export async function POST(request: Request) {
  const forbidden = assertSameOrigin(request);
  if (forbidden) return forbidden;
  const limited = await rateLimit(request, "login", 8, 5 * 60_000);
  if (limited) return limited;
  const parsed = await parseJson(request, loginSchema);
  if ("error" in parsed) return parsed.error;

  const user = await getAuthService().signIn(parsed.data.email, parsed.data.password);
  if (!user) return NextResponse.json({ error: "Nieprawidłowy e-mail lub hasło." }, { status: 401 });
  const redirectTo = user.role === "admin" ? "/admin" : user.role === "provider" ? "/panel" : "/konto";
  return NextResponse.json({ user: { name: user.name, role: user.role }, redirectTo });
}
