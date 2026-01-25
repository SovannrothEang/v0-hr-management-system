/**
 * JWT Token Verification Utility
 * Handles token verification and user extraction
 */

import jwt from 'jsonwebtoken';
import { RoleName } from '@/lib/constants/roles';

// JWT secret key - should be in environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'hrflow-secret-key';

// Token expiration (24 hours)
export const JWT_EXPIRES_IN = '24h';

// User payload structure in JWT
export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  department?: string;
  employeeId?: string;
  iat?: number; // issued at
  exp?: number; // expiration
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
