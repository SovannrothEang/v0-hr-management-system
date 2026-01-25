/**
 * withAuth Higher-Order Function
 * Wraps API route handlers with authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader, JWTPayload } from './verify-token';

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
 * Verifies JWT token and attaches user to request
 * 
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler with authentication
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => {
    // Get authorization header
    const authHeader = request.headers.get('authorization');

    // Verify token
    const user = verifyAuthHeader(authHeader);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Attach user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    // Call the original handler
    return handler(authenticatedRequest, context);
  };
}
