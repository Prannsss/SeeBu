import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const HOME: Record<string, string> = {
  client: '/client',
  admin: '/admin',
  superadmin: '/superadmin',
  workforce: '/workforce',
  'workforce-admin': '/workforce-admin',
};

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;
  const needsSetup = request.cookies.get('needs-setup')?.value === '1';
  const pathname = request.nextUrl.pathname;

  // Only invited staff who haven't chosen their own password yet may open this page.
  if (pathname === '/auth/change-password') {
    if (!authToken) return NextResponse.redirect(new URL('/auth/login', request.url));
    if (!needsSetup) return NextResponse.redirect(new URL((userRole && HOME[userRole]) || '/', request.url));
    return NextResponse.next();
  }

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

      // Dashboards stay closed until an invited account has set its own password.
      if (needsSetup) {
        return NextResponse.redirect(new URL('/auth/change-password', request.url));
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
  matcher: ['/client/:path*', '/admin/:path*', '/superadmin/:path*', '/workforce/:path*', '/workforce-admin/:path*', '/auth/change-password'],
};
