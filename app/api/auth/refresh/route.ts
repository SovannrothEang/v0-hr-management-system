/**
 * Token Refresh Endpoint
 * Allows users to refresh their access token using a refresh token
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateToken, generateRefreshToken } from "@/lib/auth/verify-token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          message: error instanceof Error ? error.message : "Invalid refresh token" 
        },
        { status: 401 }
      );
    }

    // Generate new tokens
    const tokenPayload = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      department: decoded.department,
      employeeId: decoded.employeeId,
    };

    const newAccessToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: tokenPayload,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
