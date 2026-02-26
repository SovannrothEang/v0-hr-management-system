/**
 * withAuth Higher-Order Function
 * Wraps API route handlers with cookie-based authentication and CSRF protection
 * Automatically refreshes expired sessions using refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTPayload } from './verify-token';
import { 
  getAuthSessionFromRequest, 
  validateCsrfToken, 
  requiresCsrfValidation,
  refreshAuthSession,
  getSessionExpiry,
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME
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
 * Automatically attempts to refresh expired sessions
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
    let response: NextResponse | null = null;

    // If no valid user session, try to refresh
    if (!user) {
      console.log('[withAuth] No valid session, checking for refresh token...');
      
      // Check if refresh token exists
      const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
      
      if (refreshToken) {
        console.log('[withAuth] Refresh token found, attempting refresh...');
        
        // Create a temporary response to capture new cookies
        const tempResponse = NextResponse.json({});
        const sessionData = refreshAuthSession(request, tempResponse);
        
        if (sessionData) {
          console.log('[withAuth] Session refreshed successfully');
          // Create a new request with the refreshed session
          user = sessionData.user as unknown as JWTPayload;
          response = tempResponse;
        } else {
          console.log('[withAuth] Refresh failed, clearing cookies');
          // Refresh failed, clear all auth cookies
          response = NextResponse.json(
            { success: false, message: 'Session expired' },
            { status: 401 }
          );
          response.cookies.set(AUTH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
          response.cookies.set(REFRESH_COOKIE_NAME, '', { maxAge: 0, path: '/api/auth' });
          return response;
        }
      } else {
        console.log('[withAuth] No refresh token, authentication required');
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
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

    // Attach user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    // Call the original handler
    const result = await handler(authenticatedRequest, context);
    
    // If we have new cookies from refresh, copy them to the result
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        result.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite as 'strict' | 'lax' | 'none',
          path: cookie.path,
          maxAge: cookie.maxAge,
        });
      });
    }
    
    return result;
  };
}

/**
 * Wrap an API route handler with authentication for proxy routes
 * Automatically attempts to refresh expired sessions
 * 
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler with authentication
 */
export function withAuthProxy(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => {
    let user = getAuthSessionFromRequest(request);
    let response: NextResponse | null = null;

    // If no valid user session, try to refresh
    if (!user) {
      console.log('[withAuthProxy] No valid session, checking for refresh token...');
      
      // Check if refresh token exists
      const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
      
      if (refreshToken) {
        console.log('[withAuthProxy] Refresh token found, attempting refresh...');
        
        // Create a temporary response to capture new cookies
        const tempResponse = NextResponse.json({});
        const sessionData = refreshAuthSession(request, tempResponse);
        
        if (sessionData) {
          console.log('[withAuthProxy] Session refreshed successfully');
          user = sessionData.user as unknown as JWTPayload;
          response = tempResponse;
        } else {
          console.log('[withAuthProxy] Refresh failed, clearing cookies');
          // Refresh failed, clear all auth cookies
          response = NextResponse.json(
            { success: false, message: 'Session expired' },
            { status: 401 }
          );
          response.cookies.set(AUTH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
          response.cookies.set(REFRESH_COOKIE_NAME, '', { maxAge: 0, path: '/api/auth' });
          return response;
        }
      } else {
        console.log('[withAuthProxy] No refresh token, authentication required');
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    // Call the original handler
    const result = await handler(authenticatedRequest, context);
    
    // If we have new cookies from refresh, copy them to the result
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        result.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite as 'strict' | 'lax' | 'none',
          path: cookie.path,
          maxAge: cookie.maxAge,
        });
      });
    }
    
    return result;
  };
}
