/**
 * JWT Token Verification Utility
 * Handles token verification and user extraction
 */

import jwt from 'jsonwebtoken';
import { RoleName } from '@/lib/constants/roles';

// JWT secret keys - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'hrflow-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hrflow-refresh-secret-key';

// Token expiration times
export const JWT_EXPIRES_IN = '24h'; // Access token: 24 hours
export const JWT_REFRESH_EXPIRES_IN = '7d'; // Refresh token: 7 days

// User payload structure in JWT
export interface JWTPayload {
  id: string;
  email: string;
  username: string;
  roles: RoleName[];
  department?: string;
  employeeId?: string;
  externalAccessToken?: string;
  externalRefreshToken?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

/**
 * Verify and decode a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded user payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Generate a JWT token for a user
 * @param payload - User data to encode in the token
 * @returns The signed JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Generate a refresh token for a user
 * @param payload - User data to encode in the refresh token
 * @param jti - Optional JWT ID for token rotation tracking
 * @returns The signed refresh token
 */
export function generateRefreshToken(
  payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>,
  jti?: string
): string {
  const tokenPayload = jti ? { ...payload, jti } : payload;
  return jwt.sign(tokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

/**
 * Verify a refresh token
 * @param token - The refresh token to verify
 * @returns The decoded user payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
}

/**
 * Check if a token is about to expire (within 5 minutes)
 * @param token - The JWT token to check
 * @returns True if token expires within 5 minutes
 */
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded.exp) return false;
    
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return expirationTime - currentTime < fiveMinutes;
  } catch {
    return false;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns The extracted token or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  // Support both "Bearer <token>" and just "<token>"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
}

/**
 * Verify token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns The decoded user payload or null if invalid
 */
export function verifyAuthHeader(authHeader: string | null): JWTPayload | null {
  const token = extractTokenFromHeader(authHeader);
  if (!token) return null;
  
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
