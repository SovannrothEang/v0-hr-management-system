/**
 * Token Refresh Endpoint
 * Refreshes session using refresh token from httpOnly cookie
 * Implements token rotation for security
 */

import { NextRequest, NextResponse } from "next/server";
import { refreshAuthSession, clearAuthSession, getAuthSessionFromRequest } from "@/lib/session";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";
import { checkRateLimit, getClientId, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const metadata = getRequestMetadata(request);
    const clientId = getClientId(request);

    // Get user info for rate limiting (if available)
    const currentSession = getAuthSessionFromRequest(request);
    const rateLimitKey = currentSession 
      ? `refresh:${currentSession.id}` // Per-user rate limit
      : `refresh:${clientId}`; // Per-IP rate limit for unauthenticated

    // Apply rate limiting
    const rateLimit = checkRateLimit(rateLimitKey, RateLimitPresets.REFRESH);
    
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      
      logAuditEvent(AuditAction.TOKEN_REFRESH, currentSession as any, {
        ...metadata,
        success: false,
        details: { reason: 'rate_limited' },
        errorMessage: 'Too many refresh attempts',
      });

      return NextResponse.json(
        { 
          success: false, 
          message: `Too many refresh attempts. Please try again in ${retryAfter} seconds.` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RateLimitPresets.REFRESH.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      data: {},
    });

    // Refresh session using cookie
    const sessionData = refreshAuthSession(request, response);

    if (!sessionData) {
      // Clear any stale cookies
      clearAuthSession(response);
      
      // Log failed refresh attempt
      logAuditEvent(AuditAction.TOKEN_REFRESH, currentSession as any, {
        ...metadata,
        success: false,
        details: { reason: 'invalid_or_expired_token' },
        errorMessage: 'Session expired or token invalid',
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Session expired. Please log in again." 
        },
        { 
          status: 401,
          headers: {
            'X-RateLimit-Limit': RateLimitPresets.REFRESH.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      );
    }

    // Log token refresh
    logAuditEvent(AuditAction.TOKEN_REFRESH, sessionData.user as any, {
      ...metadata,
      success: true,
      details: { 
        email: sessionData.user.email,
        role: sessionData.user.role,
      },
    });

    // Return success with session data
    // Note: Need to create new response to include session data
    const finalResponse = NextResponse.json(
      {
        success: true,
        message: "Token refreshed successfully",
        data: {
          user: sessionData.user,
          expiresAt: sessionData.expiresAt,
          csrfToken: sessionData.csrfToken,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': RateLimitPresets.REFRESH.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        },
      }
    );

    // Copy cookies from original response
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.name !== 'csrf_token',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: cookie.name === 'refresh_token' ? '/api/auth' : '/',
        maxAge: cookie.name === 'refresh_token' ? 7 * 24 * 60 * 60 : 24 * 60 * 60,
      });
    });

    return finalResponse;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
