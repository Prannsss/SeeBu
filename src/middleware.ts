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
  // Sort by route length descending so more specific paths (like /workforce-admin) match first
  const sortedRoutes = Object.entries(roleRoutes).sort((a, b) => b[0].length - a[0].length);
  for (const [route, requiredRole] of sortedRoutes) {
    if (pathname.startsWith(route)) {
      if (!authToken) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      
      if (userRole !== requiredRole) {
        return NextResponse.redirect(new URL('/forbidden', request.url));
      }

      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/client/:path*', '/admin/:path*', '/superadmin/:path*', '/workforce/:path*', '/workforce-admin/:path*'],
};
