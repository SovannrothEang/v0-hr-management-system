/**
 * Next.js Proxy (formerly Middleware)
 * Handles authentication checks for protected API routes
 * 
 * Note: Security headers are now configured in next.config.mjs
 * Note: Proxy runs on Edge runtime - JWT verification is done in API routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie name for auth token
const AUTH_COOKIE_NAME = 'auth_token';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/session',
  '/api/auth/refresh',
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/employees',
  '/api/payroll',
  '/api/leave-requests',
  '/api/reports',
  '/api/attendance',
  '/api/dashboard',
  '/api/departments',
  '/api/audit-logs',
];

/**
 * Check if the path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if the path is a protected API route
 */
function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Proxy function - runs before routes are rendered
 * Checks for auth cookie on protected API routes
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without auth check
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check protected API routes for auth cookie
  if (isProtectedApiRoute(pathname)) {
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

    if (!authCookie?.value) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Token validation is done in API routes via withAuth/withRole
    // Proxy just checks for cookie presence (Edge runtime limitation)
  }

  // Allow all other routes (pages are protected by AuthGuard component)
  return NextResponse.next();
}

// Configure which routes this proxy runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
