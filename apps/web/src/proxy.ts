import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken');
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/admin/login'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (accessToken && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!accessToken && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
