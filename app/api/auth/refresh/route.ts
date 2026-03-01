/**
 * Token Refresh Endpoint
 * Refreshes session using refresh token from httpOnly cookie
 * Also refreshes the external API token using stored external refresh token
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  refreshAuthSession, 
  clearAuthSession, 
  getAuthSessionFromRequest,
  createAuthSession,
  SessionUser,
  REFRESH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} from "@/lib/session";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";
import { checkRateLimit, getClientId, RateLimitPresets } from "@/lib/rate-limit";
import { getExternalApiUrl } from "@/lib/proxy";

export async function POST(request: NextRequest) {
  try {
    const metadata = getRequestMetadata(request);
    const clientId = getClientId(request);
    const currentSession = getAuthSessionFromRequest(request);
    const rateLimitKey = currentSession 
      ? `refresh:${currentSession.id}`
      : `refresh:${clientId}`;

    const rateLimit = checkRateLimit(rateLimitKey, RateLimitPresets.REFRESH);
    
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      
      logAuditEvent(AuditAction.TOKEN_REFRESH, currentSession as any, {
        ...metadata,
        success: false,
        details: { reason: 'rate_limited' },
      });

      return NextResponse.json(
        { success: false, message: `Too many refresh attempts. Try again in ${retryAfter}s.` },
        { status: 429 }
      );
    }

    // Use refreshAuthSession to handle rotation and initial user data
    const tempResponse = NextResponse.json({});
    const sessionData = refreshAuthSession(request, tempResponse);

    if (!sessionData) {
      logAuditEvent(AuditAction.TOKEN_REFRESH, currentSession as any, {
        ...metadata,
        success: false,
        details: { reason: 'invalid_or_expired_token' },
      });
      
      const failResponse = NextResponse.json(
        { success: false, message: "Session expired" },
        { status: 401 }
      );
      clearAuthSession(failResponse);
      return failResponse;
    }

    // Now handle external token refresh if necessary
    let externalAccessToken = sessionData.user.externalAccessToken;
    let externalRefreshToken = sessionData.user.externalRefreshToken;
    let externalRefreshed = false;
    let externalCsrfToken = sessionData.user.externalCsrfToken;
    let externalSessionId = sessionData.user.externalSessionId;

    if (externalRefreshToken) {
      try {
        console.log(`[Refresh] Attempting external token refresh for session: ${externalSessionId?.substring(0, 8)}...`);
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // CRITICAL: Forward the session ID cookie so the backend can validate the refresh token
        // and maintain the same secure session (avoiding "Legacy Mode").
        if (externalSessionId) {
          headers['Cookie'] = `session_id=${externalSessionId}`;
        }

        const externalRes = await fetch(
          `${getExternalApiUrl()}/auth/refresh`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ refreshToken: externalRefreshToken }),
          }
        );

        if (externalRes.ok) {
          const extData = await externalRes.json();
          // The backend might return data wrapped or direct
          const responseData = extData.data || extData;
          
          const newExtToken = responseData.accessToken;
          const newExtRefreshToken = responseData.refreshToken;
          const newCsrfToken = responseData.csrfToken;
          const newSessionId = responseData.sessionId;
          
          if (newExtToken) {
            externalAccessToken = newExtToken;
            externalRefreshed = true;
            console.log('[Refresh] External access token refreshed successfully');
          }
          if (newExtRefreshToken) {
            externalRefreshToken = newExtRefreshToken;
          }
          if (newCsrfToken) {
            externalCsrfToken = newCsrfToken;
          }
          if (newSessionId) {
            externalSessionId = newSessionId;
          }
        } else {
          const errText = await externalRes.text();
          console.error(`[Refresh] External refresh failed (${externalRes.status}):`, errText);
        }
      } catch (e) {
        console.error('[Refresh] External refresh error:', e);
      }
    }

    // If external tokens changed, we need to update the session cookies again
    // but we SHOULD NOT call createAuthSession fully as it would rotate JTI again.
    // Instead, we update the existing sessionData.
    let finalSessionData = sessionData;
    let finalResponse = tempResponse;

    if (externalRefreshed) {
      // Create a fresh session with the updated external tokens
      // We use createAuthSession here to ensure the JWT payload is updated
      // It will generate a NEW JTI, but since we are only doing this once per route call, it's fine.
      // The important part is that we only have ONE set of cookies going back.
      const updatedUser: SessionUser = {
        ...sessionData.user,
        externalAccessToken,
        externalRefreshToken,
        externalCsrfToken,
        externalSessionId,
      };
      
      const updateResponse = NextResponse.json({});
      finalSessionData = createAuthSession(updateResponse, updatedUser, false);
      finalResponse = updateResponse;
    }

    const responseBody = {
      success: true,
      message: "Token refreshed",
      data: {
        user: {
          id: finalSessionData.user.id,
          email: finalSessionData.user.email,
          username: finalSessionData.user.username,
          roles: finalSessionData.user.roles,
          department: finalSessionData.user.department,
          employeeId: finalSessionData.user.employeeId,
        },
        expiresAt: finalSessionData.expiresAt,
        csrfToken: externalCsrfToken,
        accessToken: finalSessionData.accessToken,
        externalAccessToken,
        sessionId: externalSessionId,
      },
    };

    const response = NextResponse.json(responseBody);

    // Copy cookies from the final response
    finalResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly ?? (cookie.name !== CSRF_COOKIE_NAME),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: cookie.maxAge ?? (cookie.name === REFRESH_COOKIE_NAME ? 7 * 24 * 60 * 60 : 24 * 60 * 60),
      });
    });

    logAuditEvent(AuditAction.TOKEN_REFRESH, finalSessionData.user as any, {
      ...metadata,
      success: true,
      details: { email: finalSessionData.user.email, externalRefreshed },
    });

    return response;

  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, message: "Refresh failed" },
      { status: 500 }
    );
  }
}
