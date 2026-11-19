import { NextResponse } from "next/server";
import { getAuthService } from "@/services/auth/auth-service";
import { assertSameOrigin } from "@/lib/api";

export async function POST(request: Request) {
  const forbidden = assertSameOrigin(request);
  if (forbidden) return forbidden;
  await getAuthService().signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
