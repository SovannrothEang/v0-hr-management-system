/**
 * withRole Higher-Order Function
 * Wraps API route handlers with role-based authorization
 * Uses cookie-based authentication with CSRF protection
 */

import { NextResponse } from 'next/server';
import { RoleName, hasRole } from '../constants/roles';
import { withAuth, AuthenticatedHandler } from './with-auth';

/**
 * Wrap an API route handler with role-based authorization
 * Requires authentication and checks if user has one of the allowed roles
 * 
 * @param handler - The API route handler to wrap
 * @param allowedRoles - Array of roles that are allowed to access this route
 * @returns Wrapped handler with authentication and authorization
 * 
 * @example
 * // Only allow admin and hr_manager
 * export const GET = withRole(async (request) => {
 *   // request.user is guaranteed to have admin or hr_manager role
 *   return NextResponse.json({ data: 'protected data' });
 * }, [ROLES.ADMIN, ROLES.HR_MANAGER]);
 */
export function withRole(
  handler: AuthenticatedHandler,
  allowedRoles: RoleName[]
) {
  return withAuth(async (request, context) => {
    // Check if user has one of the allowed roles
    if (!hasRole(request.user.role, allowedRoles)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Insufficient permissions',
          required: allowedRoles,
          current: request.user.role,
        },
        { status: 403 }
      );
    }

    // Call the original handler
    return handler(request, context);
  });
}
