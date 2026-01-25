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

  // Create response
  let response: NextResponse;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    response = NextResponse.next();
  }
  // Check if this is a protected API route
  else if (isProtectedApiRoute(pathname)) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      response = NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    } else {
      // Token validation will be done in API routes (middleware runs on Edge runtime)
      // Just pass the token through for now
      response = NextResponse.next();
    }
  }
  // Allow all other routes (pages are protected by AuthGuard component)
  else {
    response = NextResponse.next();
  }

  // Add security headers to all responses
  const headers = response.headers;

  // Content Security Policy
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Strict Transport Security (HSTS)
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  return response;
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
