/**
 * Logout Endpoint
 * Clears httpOnly auth cookies to end the session
 */

import { NextRequest, NextResponse } from "next/server";
import { clearAuthSession, getAuthSessionFromRequest } from "@/lib/session";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  try {
    const metadata = getRequestMetadata(request);
    
    // Get current user before clearing session (for audit log)
    const user = getAuthSessionFromRequest(request);

    // Call external API logout if possible
    if (user?.externalAccessToken) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/auth/logout`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${user.externalAccessToken}`,
            },
          }
        ).catch(() => {}); // Ignore errors on external logout
      } catch (e) {
        // Ignore errors
      }
    }

    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully",
      data: null,
    });

    // Clear auth cookies
    clearAuthSession(response);

    // Log logout event
    if (user) {
      logAuditEvent(AuditAction.LOGOUT, user, {
        ...metadata,
        success: true,
        details: { 
          email: user.email,
          roles: user.roles,
        },
      });
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    
    // Still try to clear cookies even if there's an error
    const response = NextResponse.json(
      { success: true, message: "Logged out", data: null },
      { status: 200 }
    );
    clearAuthSession(response);
    
    return response;
  }
}
