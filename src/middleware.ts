import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;
  const pathname = request.nextUrl.pathname;

  // Define role-based route mappings
  const roleRoutes = {
    '/client': 'client',
    '/admin': 'admin',
    '/superadmin': 'superadmin',
    '/workforce': 'workforce',
    '/workforce-admin': 'workforce-admin'
  };

  // Find if the current path requires a specific role
  for (const [route, requiredRole] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!authToken) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      
      if (userRole !== requiredRole) {
        return NextResponse.redirect(new URL('/forbidden', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/client/:path*', '/admin/:path*', '/superadmin/:path*', '/workforce/:path*', '/workforce-admin/:path*'],
};
