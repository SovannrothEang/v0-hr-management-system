/**
 * Next.js Middleware for Authentication
 * Note: Middleware runs on Edge runtime, so JWT verification is done in API routes
 * This middleware only checks for token presence and passes it through
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
];

// Routes that require authentication (API routes only, pages are handled by AuthGuard)
const PROTECTED_API_ROUTES = [
  '/api/employees',
  '/api/payroll',
  '/api/leave-requests',
  '/api/reports',
  '/api/attendance',
  '/api/dashboard',
  '/api/departments',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));
}

function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if this is a protected API route
  if (isProtectedApiRoute(pathname)) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Token validation will be done in API routes (middleware runs on Edge runtime)
    // Just pass the token through for now
    return NextResponse.next();
  }

  // Allow all other routes (pages are protected by AuthGuard component)
  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
