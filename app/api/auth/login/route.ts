/**
 * Login Endpoint
 * Validates credentials and creates httpOnly cookie session
 */

import { NextResponse } from "next/server";
import { ROLES } from "@/lib/constants/roles";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";
import { checkRateLimit, getClientId, RateLimitPresets } from "@/lib/rate-limit";
import { createAuthSession, SessionUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const metadata = getRequestMetadata(request);
    const clientId = getClientId(request);

    // Apply rate limiting
    const rateLimit = checkRateLimit(`login:${clientId}`, RateLimitPresets.AUTH);
    
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      
      // Log rate limit violation
      logAuditEvent(AuditAction.LOGIN_FAILED, null, {
        ...metadata,
        success: false,
        details: { reason: 'rate_limited', clientId },
        errorMessage: 'Too many login attempts',
      });

      return NextResponse.json(
        { 
          success: false, 
          message: `Too many login attempts. Please try again in ${retryAfter} seconds.` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RateLimitPresets.AUTH.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Call external API for login
    const externalApiResponse = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!externalApiResponse.ok) {
      const errorData = await externalApiResponse.json().catch(() => ({}));
      
      // Log failed login attempt
      logAuditEvent(AuditAction.LOGIN_FAILED, null, {
        ...metadata,
        success: false,
        details: { email },
        errorMessage: errorData.message || "Invalid email or password",
      });
      
      return NextResponse.json(
        { success: false, message: errorData.message || "Invalid email or password" },
        { 
          status: externalApiResponse.status,
          headers: {
            'X-RateLimit-Limit': RateLimitPresets.AUTH.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    const loginData = await externalApiResponse.json();
    const externalUser = loginData.data.user;
    const externalAccessToken = loginData.data.accessToken;
    const externalRefreshToken = loginData.data.refreshToken;
    const externalSessionId = loginData.data.sessionId;
    const externalCsrfToken = loginData.data.csrfToken;

    console.log("[Login] Backend response:", {
      hasSessionId: !!externalSessionId,
      hasCsrfToken: !!externalCsrfToken,
      sessionId: externalSessionId ? `${externalSessionId.substring(0, 8)}...` : null,
      csrfToken: externalCsrfToken ? `${externalCsrfToken.substring(0, 8)}...` : null,
    });

    const sessionUser: SessionUser = {
      id: externalUser.id,
      email: externalUser.email,
      username: externalUser.username || externalUser.email,
      roles: externalUser.roles,
      department: externalUser.department,
      employeeId: externalUser.employeeId,
      externalAccessToken: externalAccessToken,
      externalRefreshToken: externalRefreshToken,
      externalCsrfToken: externalCsrfToken,
      externalSessionId: externalSessionId,
    };

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: sessionUser.id,
            email: sessionUser.email,
            username: sessionUser.username,
            roles: sessionUser.roles,
            department: sessionUser.department,
            employeeId: sessionUser.employeeId,
          },
          // expiresAt and csrfToken will be added below
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': RateLimitPresets.AUTH.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        }
      }
    );

    // Create session and set cookies (isNewLogin = true to clear any compromised status)
    const sessionData = createAuthSession(response, sessionUser, true);

    // Log successful login
    logAuditEvent(AuditAction.LOGIN, sessionUser, {
      ...metadata,
      success: true,
      details: { 
        email: sessionUser.email,
        roles: sessionUser.roles,
      },
    });

    // Return response with session info
    const finalResponse = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: sessionUser.id,
            email: sessionUser.email,
            username: sessionUser.username,
            roles: sessionUser.roles,
            department: sessionUser.department,
            employeeId: sessionUser.employeeId,
            avatar: `/api/users/${sessionUser.id}/image`,
          },
          expiresAt: sessionData.expiresAt,
          csrfToken: externalCsrfToken,
          accessToken: sessionData.accessToken,
          sessionId: externalSessionId,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': RateLimitPresets.AUTH.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        }
      }
    );

    // Copy cookies from original response
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.name !== 'csrf_token',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: cookie.name === 'refresh_token' ? 7 * 24 * 60 * 60 : 24 * 60 * 60,
      });
    });

    return finalResponse;
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
