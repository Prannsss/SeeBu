import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value;

  const protectedRoutes = ['/admin', '/superadmin', '/workforce', '/workforce-admin'];
  
  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/forbidden', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/workforce/:path*', '/workforce-admin/:path*'],
};
