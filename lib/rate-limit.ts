/**
 * Rate Limiting Utility
 * Implements token bucket algorithm for rate limiting
 */

interface RateLimitConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 * @returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 } // Default: 100 requests per minute
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or window has passed, create new entry
  if (!entry || now >= entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Predefined rate limit configs for different endpoint types
 */
export const RateLimitPresets = {
  // Very strict for auth endpoints
  AUTH: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute
  
  // Strict for mutation operations
  WRITE: { maxRequests: 30, windowMs: 60000 }, // 30 requests per minute
  
  // Moderate for read operations
  READ: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  
  // Lenient for general API
  GENERAL: { maxRequests: 200, windowMs: 60000 }, // 200 requests per minute
};
