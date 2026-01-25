import { NextResponse } from "next/server";
import { generateToken, generateRefreshToken } from "@/lib/auth/verify-token";
import { ROLES } from "@/lib/constants/roles";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";
import { checkRateLimit, getClientId, RateLimitPresets } from "@/lib/rate-limit";

const mockUsers = [
  {
    id: "admin-1",
    email: "admin@hrflow.com",
    password: "admin123",
    name: "Admin User",
    role: ROLES.ADMIN,
    department: "Administration",
  },
  {
    id: "hr-1",
    email: "hr@hrflow.com",
    password: "hr123",
    name: "Emily Rodriguez",
    role: ROLES.HR_MANAGER,
    department: "Human Resources",
    employeeId: "EMP003",
  },
  {
    id: "emp-1",
    email: "sarah.johnson@hrflow.com",
    password: "emp123",
    name: "Sarah Johnson",
    role: ROLES.EMPLOYEE,
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

    const { password: _, ...userWithoutPassword } = user;
    
    // Generate JWT tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
    };
    
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Log successful login
    logAuditEvent(AuditAction.LOGIN, tokenPayload, {
      ...metadata,
      success: true,
      details: { 
        email: user.email,
        role: user.role,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        refreshToken,
      },
    }, {
      headers: {
        'X-RateLimit-Limit': RateLimitPresets.AUTH.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
      }
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
