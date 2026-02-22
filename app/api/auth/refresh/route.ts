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
  AUTH_COOKIE_NAME,
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

    let externalAccessToken = sessionData.user.externalAccessToken;
    let externalRefreshToken = sessionData.user.externalRefreshToken;
    let externalRefreshed = false;

    if (externalRefreshToken) {
      try {
        const externalRes = await fetch(
          `${getExternalApiUrl()}/auth/refresh-legacy`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: externalRefreshToken }),
          }
        );

        if (externalRes.ok) {
          const extData = await externalRes.json();
          const newExtToken = extData.accessToken || extData.data?.accessToken;
          if (newExtToken) {
            externalAccessToken = newExtToken;
            externalRefreshed = true;
            console.log('[Refresh] External token refreshed');
          }
        }
      } catch (e) {
        console.error('[Refresh] External refresh error:', e);
      }
    }

    const user: SessionUser = {
      ...sessionData.user,
      externalAccessToken,
      externalRefreshToken,
    };

    const cookieResponse = NextResponse.json({});
    const newSession = createAuthSession(cookieResponse, user, false);

    const response = NextResponse.json({
      success: true,
      message: "Token refreshed",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
          department: user.department,
          employeeId: user.employeeId,
        },
        expiresAt: newSession.expiresAt,
        csrfToken: newSession.csrfToken,
        accessToken: newSession.accessToken,
        externalAccessToken,
      },
    });

    cookieResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.name !== CSRF_COOKIE_NAME,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: cookie.name === REFRESH_COOKIE_NAME ? '/api/auth' : '/',
        maxAge: cookie.name === REFRESH_COOKIE_NAME ? 7 * 24 * 60 * 60 : 24 * 60 * 60,
      });
    });

    console.log('[Refresh] Complete. Cookies:', response.cookies.getAll().map(c => c.name));

    logAuditEvent(AuditAction.TOKEN_REFRESH, user as any, {
      ...metadata,
      success: true,
      details: { email: user.email, externalRefreshed },
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
