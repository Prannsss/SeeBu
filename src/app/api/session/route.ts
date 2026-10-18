import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const MAX_AGE = 60 * 60 * 24; // 24h, matches the JWT's practical session length

export async function POST(request: NextRequest) {
  const { token, role, needsSetup } = await request.json().catch(() => ({}));

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

  // Evict any stale session cookies before writing new credentials.
  // A leftover user-role from a previous user / partial logout causes the middleware
  // to see the wrong role → /forbidden redirect immediately after login.
  cookieStore.delete("auth-token");
  cookieStore.delete("user-role");
  cookieStore.delete("needs-setup");

  cookieStore.set("auth-token", token, cookieOptions);
  // user-role is read by middleware.ts for route gating only, not sensitive on its own,
  // but there's no reason for page JS to read it either — keep it httpOnly too.
  cookieStore.set("user-role", role, cookieOptions);
  // Invited staff who still have to choose their own password; middleware.ts routes them to
  // /auth/change-password. The backend enforces the same rule on every API call.
  if (needsSetup === true) cookieStore.set("needs-setup", "1", cookieOptions);

  return NextResponse.json({ ok: true });
}

/** Called after the password is set: the account is fully active now. */
export async function PATCH() {
  const cookieStore = await cookies();
  cookieStore.delete("needs-setup");
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  cookieStore.delete("user-role");
  cookieStore.delete("needs-setup");
  return NextResponse.json({ ok: true });
}
