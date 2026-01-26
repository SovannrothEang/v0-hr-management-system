/**
 * Token Refresh Endpoint
 * Refreshes session using refresh token from httpOnly cookie
 */

import { NextRequest, NextResponse } from "next/server";
import { refreshAuthSession, clearAuthSession } from "@/lib/session";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  try {
    const metadata = getRequestMetadata(request);

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
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Session expired. Please log in again." 
        },
        { status: 401 }
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
    const finalResponse = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        user: sessionData.user,
        expiresAt: sessionData.expiresAt,
        csrfToken: sessionData.csrfToken,
      },
    });

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
