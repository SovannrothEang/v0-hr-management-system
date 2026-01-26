/**
 * Server-Side Session Management
 * Handles httpOnly cookie-based authentication with CSRF protection
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  verifyToken, 
  verifyRefreshToken, 
  generateToken, 
  generateRefreshToken,
  JWTPayload,
  JWT_EXPIRES_IN,
} from '@/lib/auth/verify-token';
import { 
  generateTokenId,
  markTokenAsUsed,
  isTokenUsed,
  setActiveToken,
  isFamilyCompromised,
  markFamilyCompromised,
  clearCompromisedStatus,
} from '@/lib/auth/token-store';
import { RoleName } from '@/lib/constants/roles';

// Cookie names
export const AUTH_COOKIE_NAME = 'auth_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const CSRF_COOKIE_NAME = 'csrf_token';

// Cookie configuration
const isProduction = process.env.NODE_ENV === 'production';

const ACCESS_TOKEN_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roles: RoleName[];
  department?: string;
  employeeId?: string;
}

export interface SessionData {
  user: SessionUser;
  expiresAt: number; // Unix timestamp in milliseconds
  csrfToken: string;
}

/**
 * Generate a CSRF token using Web Crypto API (Edge-compatible)
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate token expiry time from JWT payload
 */
function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.exp ? payload.exp * 1000 : Date.now() + ACCESS_TOKEN_MAX_AGE * 1000;
  } catch {
    return Date.now() + ACCESS_TOKEN_MAX_AGE * 1000;
  }
}

/**
 * Create auth session - sets httpOnly cookies on the response
 * @param response - The NextResponse to set cookies on
 * @param user - User data to store in tokens
 * @param isNewLogin - Whether this is a fresh login (clears compromised status)
 * @returns Session data including CSRF token and expiry
 */
export function createAuthSession(
  response: NextResponse,
  user: SessionUser,
  isNewLogin: boolean = false
): SessionData {
  // Clear compromised status on fresh login
  if (isNewLogin) {
    clearCompromisedStatus(user.id);
  }

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    department: user.department,
    employeeId: user.employeeId,
  };

  const accessToken = generateToken(tokenPayload as Omit<JWTPayload, 'iat' | 'exp'>);
  
  // Generate refresh token with unique JTI for rotation tracking
  const refreshTokenId = generateTokenId();
  const refreshToken = generateRefreshToken(
    tokenPayload as Omit<JWTPayload, 'iat' | 'exp' | 'jti'>,
    refreshTokenId
  );
  
  // Track this as the active refresh token for the user
  setActiveToken(user.id, refreshTokenId);
  
  const csrfToken = generateCsrfToken();

  // Set access token cookie (httpOnly, secure)
  response.cookies.set(AUTH_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  // Set refresh token cookie (httpOnly, secure, restricted path)
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth', // Only sent to auth endpoints
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  // Set CSRF token cookie (NOT httpOnly - needs to be readable by JS)
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Readable by JavaScript
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  const expiresAt = getTokenExpiry(accessToken);

  return {
    user,
    expiresAt,
    csrfToken,
  };
}

/**
 * Get current auth session from cookies (server-side)
 * @returns Session user data or null if not authenticated
 */
export async function getAuthSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!authToken) {
    return null;
  }

  try {
    const payload = verifyToken(authToken);
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      roles: payload.roles,
      department: payload.department,
      employeeId: payload.employeeId,
    };
  } catch {
    return null;
  }
}

/**
 * Get auth session from request cookies (for API routes/middleware)
 * @param request - The incoming request
 * @returns JWT payload or null if not authenticated
 */
export function getAuthSessionFromRequest(request: NextRequest): JWTPayload | null {
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!authToken) {
    return null;
  }

  try {
    return verifyToken(authToken);
  } catch {
    return null;
  }
}

/**
 * Validate CSRF token from request header against cookie
 * @param request - The incoming request
 * @returns True if CSRF token is valid
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const csrfHeader = request.headers.get('X-CSRF-Token');

  if (!csrfCookie || !csrfHeader) {
    return false;
  }

  return csrfCookie === csrfHeader;
}

/**
 * Check if request method requires CSRF validation
 */
export function requiresCsrfValidation(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return !safeMethods.includes(method.toUpperCase());
}

/**
 * Clear auth session - removes all auth cookies
 * @param response - The NextResponse to clear cookies from
 */
export function clearAuthSession(response: NextResponse): void {
  // Clear access token
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  // Clear refresh token
  response.cookies.set(REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 0,
  });

  // Clear CSRF token
  response.cookies.set(CSRF_COOKIE_NAME, '', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Refresh auth session - validates refresh token and issues new tokens
 * Implements token rotation: each refresh token can only be used once
 * @param request - The incoming request with refresh token cookie
 * @param response - The response to set new cookies on
 * @returns New session data or null if refresh failed
 */
export function refreshAuthSession(
  request: NextRequest,
  response: NextResponse
): SessionData | null {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return null;
  }

  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    const userId = payload.id;
    const tokenJti = payload.jti;

    // Check if user's token family is compromised (security breach detected)
    if (isFamilyCompromised(userId)) {
      console.warn(`[SECURITY] Rejected refresh attempt for compromised user: ${userId}`);
      return null;
    }

    // Token rotation check: has this token already been used?
    if (tokenJti && isTokenUsed(tokenJti)) {
      // SECURITY: Token reuse detected! This could indicate token theft.
      // Invalidate the entire token family for this user.
      markFamilyCompromised(userId);
      console.error(`[SECURITY] Refresh token reuse detected for user: ${userId}, JTI: ${tokenJti}`);
      return null;
    }

    // Mark the current token as used (rotated)
    if (tokenJti) {
      markTokenAsUsed(tokenJti, userId);
    }

    // Create new session with rotated tokens
    const user: SessionUser = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      roles: payload.roles,
      department: payload.department,
      employeeId: payload.employeeId,
    };

    // Create new session (not a new login, so don't clear compromised status)
    return createAuthSession(response, user, false);
  } catch (error) {
    console.error('[Session] Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Get session expiry time from access token cookie
 * @param request - The incoming request
 * @returns Expiry timestamp in milliseconds or null
 */
export function getSessionExpiry(request: NextRequest): number | null {
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!authToken) {
    return null;
  }

  try {
    return getTokenExpiry(authToken);
  } catch {
    return null;
  }
}
