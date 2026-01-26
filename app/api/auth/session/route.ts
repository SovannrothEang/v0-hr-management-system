/**
 * Session Validation Endpoint
 * Returns current session status and user data
 * Used by client to validate session on app load
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getAuthSessionFromRequest, 
  getSessionExpiry,
  AUTH_COOKIE_NAME,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const user = getAuthSessionFromRequest(request);
    
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          authenticated: false,
          user: null,
          expiresAt: null,
        },
      });
    }

    // Get session expiry time
    const expiresAt = getSessionExpiry(request);

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          department: user.department,
          employeeId: user.employeeId,
        },
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to validate session",
        data: {
          authenticated: false,
          user: null,
          expiresAt: null,
        },
      },
      { status: 500 }
    );
  }
}
