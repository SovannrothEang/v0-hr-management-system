/**
 * withAuth Higher-Order Function
 * Wraps API route handlers with cookie-based authentication and CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTPayload } from './verify-token';
import { 
  getAuthSessionFromRequest, 
  validateCsrfToken, 
  requiresCsrfValidation 
} from '@/lib/session';

// Extended request with user data
export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

// API handler type with authenticated request
export type AuthenticatedHandler = (
  request: AuthenticatedRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap an API route handler with authentication
 * Verifies JWT token from cookie and attaches user to request
 * Also validates CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
 * 
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler with authentication
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => {
    // Get user from cookie
    const user = getAuthSessionFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate CSRF token for state-changing requests
    if (requiresCsrfValidation(request.method)) {
      if (!validateCsrfToken(request)) {
        return NextResponse.json(
          { success: false, message: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
    }

    // Attach user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    // Call the original handler
    return handler(authenticatedRequest, context);
  };
}

export function withAuthProxy(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => {
    const user = getAuthSessionFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    return handler(authenticatedRequest, context);
  };
}
