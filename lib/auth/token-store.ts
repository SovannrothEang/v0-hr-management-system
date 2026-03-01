/**
 * Refresh Token Store
 * Implements refresh token rotation with reuse detection
 * 
 * In production, this should be backed by Redis or a database
 * for persistence and multi-instance support.
 */

// Store for used (rotated) refresh tokens
// Key: token JTI (JWT ID), Value: { usedAt: timestamp, userId: string }
const usedRefreshTokens = new Map<string, { usedAt: number; userId: string }>();

// Store for active refresh token families
// Key: userId, Value: current token JTI
const activeTokenFamilies = new Map<string, string>();

// Token reuse detection - stores compromised families
const compromisedFamilies = new Set<string>();

// Cleanup interval (1 hour)
const CLEANUP_INTERVAL = 60 * 60 * 1000;

// Token retention period for reuse detection (8 days - slightly longer than refresh token lifetime)
const TOKEN_RETENTION_MS = 8 * 24 * 60 * 60 * 1000;

/**
 * Generate a unique token ID (JTI)
 */
export function generateTokenId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Mark a refresh token as used (rotated)
 * @param jti - JWT ID of the used token
 * @param userId - User ID associated with the token
 */
export function markTokenAsUsed(jti: string, userId: string): void {
  usedRefreshTokens.set(jti, {
    usedAt: Date.now(),
    userId,
  });
}

// Token rotation grace period (30 seconds)
// Allows near-simultaneous requests to use the same refresh token
const ROTATION_GRACE_PERIOD_MS = 30000;

/**
 * Check if a refresh token has already been used
 * Incorporates a grace period to handle race conditions
 * @param jti - JWT ID to check
 * @returns True if token was already used and is outside grace period
 */
export function isTokenUsed(jti: string): boolean {
  const tokenData = usedRefreshTokens.get(jti);
  if (!tokenData) return false;

  // If the token was used within the grace period, treat it as "not used yet"
  // to allow other concurrent requests to proceed.
  const timeSinceUse = Date.now() - tokenData.usedAt;
  return timeSinceUse > ROTATION_GRACE_PERIOD_MS;
}

/**
 * Set the active token for a user's token family
 * @param userId - User ID
 * @param jti - Current active token JTI
 */
export function setActiveToken(userId: string, jti: string): void {
  activeTokenFamilies.set(userId, jti);
}

/**
 * Get the active token JTI for a user
 * @param userId - User ID
 * @returns Current active token JTI or undefined
 */
export function getActiveToken(userId: string): string | undefined {
  return activeTokenFamilies.get(userId);
}

/**
 * Mark a user's token family as compromised (due to token reuse)
 * This invalidates ALL refresh tokens for the user
 * @param userId - User ID
 */
export function markFamilyCompromised(userId: string): void {
  compromisedFamilies.add(userId);
  activeTokenFamilies.delete(userId);
  console.warn(`[SECURITY] Token family compromised for user: ${userId}`);
}

/**
 * Check if a user's token family is compromised
 * @param userId - User ID
 * @returns True if family is compromised
 */
export function isFamilyCompromised(userId: string): boolean {
  return compromisedFamilies.has(userId);
}

/**
 * Clear compromised status for a user (after re-login)
 * @param userId - User ID
 */
export function clearCompromisedStatus(userId: string): void {
  compromisedFamilies.delete(userId);
}

/**
 * Invalidate all tokens for a user (logout from all devices)
 * @param userId - User ID
 */
export function invalidateAllUserTokens(userId: string): void {
  activeTokenFamilies.delete(userId);
  // Mark as compromised to reject any existing tokens
  compromisedFamilies.add(userId);
}

/**
 * Clean up expired entries from the token store
 */
function cleanupExpiredTokens(): void {
  const cutoff = Date.now() - TOKEN_RETENTION_MS;
  let cleaned = 0;

  for (const [jti, data] of usedRefreshTokens.entries()) {
    if (data.usedAt < cutoff) {
      usedRefreshTokens.delete(jti);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Token Store] Cleaned up ${cleaned} expired token entries`);
  }
}

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL);
}

/**
 * Get token store statistics (for monitoring)
 */
export function getTokenStoreStats(): {
  usedTokenCount: number;
  activeFamiliesCount: number;
  compromisedFamiliesCount: number;
} {
  return {
    usedTokenCount: usedRefreshTokens.size,
    activeFamiliesCount: activeTokenFamilies.size,
    compromisedFamiliesCount: compromisedFamilies.size,
  };
}
