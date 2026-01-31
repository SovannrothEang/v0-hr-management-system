import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/dashboard/recent-activity`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch recent activity" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data.activities || data.data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
