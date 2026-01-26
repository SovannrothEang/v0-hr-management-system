/**
 * Login Endpoint
 * Validates credentials and creates httpOnly cookie session
 */

import { NextResponse } from "next/server";
import { ROLES } from "@/lib/constants/roles";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";
import { checkRateLimit, getClientId, RateLimitPresets } from "@/lib/rate-limit";
import { createAuthSession, SessionUser } from "@/lib/session";

const mockUsers = [
  {
    id: "admin-1",
    email: "admin@hrflow.com",
    password: "admin123",
    name: "Admin User",
    roles: [ROLES.ADMIN],
    department: "Administration",
  },
  {
    id: "hr-1",
    email: "hr@hrflow.com",
    password: "hr123",
    name: "Emily Rodriguez",
    roles: [ROLES.HR_MANAGER],
    department: "Human Resources",
    employeeId: "EMP003",
  },
  {
    id: "emp-1",
    email: "sarah.johnson@hrflow.com",
    password: "emp123",
    name: "Sarah Johnson",
    roles: [ROLES.EMPLOYEE],
    department: "Engineering",
    employeeId: "EMP001",
  },
];

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

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      // Log failed login attempt
      logAuditEvent(AuditAction.LOGIN_FAILED, null, {
        ...metadata,
        success: false,
        details: { email },
        errorMessage: "Invalid email or password",
      });
      
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { 
          status: 401,
          headers: {
            'X-RateLimit-Limit': RateLimitPresets.AUTH.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    // Prepare user data (without password)
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      department: user.department,
      employeeId: user.employeeId,
    };

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: sessionUser,
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
        email: user.email,
        roles: user.roles,
      },
    });

    // Return response with session info
    // Note: We need to reconstruct the response to include session data
    const finalResponse = NextResponse.json(
      {
        success: true,
        data: {
          user: sessionUser,
          expiresAt: sessionData.expiresAt,
          csrfToken: sessionData.csrfToken,
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
        path: cookie.name === 'refresh_token' ? '/api/auth' : '/',
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
