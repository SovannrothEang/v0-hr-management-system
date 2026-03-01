/**
 * withAuth Higher-Order Function
 * Wraps API route handlers with cookie-based authentication and CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTPayload } from './verify-token';
import { 
  getAuthSessionFromRequest, 
  validateCsrfToken, 
  requiresCsrfValidation, 
  REFRESH_COOKIE_NAME,
  refreshAuthSession,
  AUTH_COOKIE_NAME,
  SessionData
} from '@/lib/session';

// Extended request with user data
export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
  sessionData?: SessionData; // Add optional session data for refreshed tokens
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
    let user = getAuthSessionFromRequest(request);
    let sessionData: SessionData | undefined = undefined;
    let refreshResponse: NextResponse | null = null;

    if (!user) {
      console.log('[withAuth] No valid session, checking for refresh token...');
      
      // Check if refresh token exists
      const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

      if (refreshToken) {
        console.log('[withAuth] Refresh token found, attempting refresh...');
        
        // Create a temporary response to capture new cookies
        const tempResponse = NextResponse.json({});
        const result = refreshAuthSession(request, tempResponse);
        
        if (result) {
          console.log('[withAuth] Session refreshed successfully');
          user = result.user as unknown as JWTPayload;
          sessionData = result;
          refreshResponse = tempResponse;
        } else {
          console.log('[withAuth] Refresh failed, clearing cookies');
          // Refresh failed, clear all auth cookies
          const response = NextResponse.json(
            { success: false, message: 'Session expired' },
            { status: 401 }
          );
          response.cookies.set(AUTH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
          response.cookies.set(REFRESH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
          return response;
        }
      } else {
        console.log('[withAuth] No refresh token, authentication required');
        const response = NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
        // Clear cookies even if we just don't have a user, to ensure client-server sync
        response.cookies.set(AUTH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
        response.cookies.set(REFRESH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
        return response;
      }
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

    // Attach user and optional session data to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
    if (sessionData) {
      authenticatedRequest.sessionData = sessionData;
    }

    // Call the original handler
    const finalResponse = await handler(authenticatedRequest, context);

    // If we refreshed the session, merge the new cookies into the final response
    if (refreshResponse) {
      refreshResponse.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          path: cookie.path,
          maxAge: cookie.maxAge,
        });
      });
    }

    return finalResponse;
  };
}

export function withAuthProxy(handler: AuthenticatedHandler) {
  // Use the same logic as withAuth for proxy handlers to ensure tokens are refreshed
  return withAuth(handler);
}
