import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const MAX_AGE = 60 * 60 * 24; // 24h, matches the JWT's practical session length

export async function POST(request: NextRequest) {
  const { token, role } = await request.json().catch(() => ({}));

  if (!token || typeof token !== "string" || !role || typeof role !== "string") {
    return NextResponse.json({ error: "Missing token or role" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };

  cookieStore.set("auth-token", token, cookieOptions);
  // user-role is read by middleware.ts for route gating only, not sensitive on its own,
  // but there's no reason for page JS to read it either — keep it httpOnly too.
  cookieStore.set("user-role", role, cookieOptions);

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  cookieStore.delete("user-role");
  return NextResponse.json({ ok: true });
}
