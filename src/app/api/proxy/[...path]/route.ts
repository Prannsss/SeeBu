import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveApiBaseUrl } from "@/lib/api";

async function forward(request: NextRequest, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  const targetUrl = `${resolveApiBaseUrl()}/api/v1/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Content-Type", request.headers.get("content-type") || "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path);
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path);
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path);
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path);
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path);
}
