import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");

  try {
    const params = new URLSearchParams();
    if (period) params.set("period", period);
    if (status && status !== "all") params.set("status", status);
    if (employeeId) params.set("employeeId", employeeId);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/payrolls?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch payroll records" },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    // Return the external API response directly
    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
