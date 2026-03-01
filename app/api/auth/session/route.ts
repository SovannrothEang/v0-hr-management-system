import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/auth/with-auth";

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user;
    const sessionData = request.sessionData;
    
    // If we have sessionData, it means a refresh just happened in withAuth
    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username || (user as any).name || user.email,
          roles: user.roles,
          department: user.department,
          employeeId: user.employeeId,
          avatar: `/api/users/${user.id}/image`,
        },
        // Provide tokens if refreshed, otherwise client uses what it has
        accessToken: sessionData?.accessToken,
        csrfToken: sessionData?.csrfToken,
        expiresAt: sessionData?.expiresAt || (user as any).exp * 1000,
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
});
