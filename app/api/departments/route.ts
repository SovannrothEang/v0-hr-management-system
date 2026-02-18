import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { getExternalApiUrl } from "@/lib/proxy";

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("pageSize", limit.toString());
    params.set("limit", limit.toString());
    params.set("childIncluded", "true");

    const response = await fetch(`${getExternalApiUrl()}/departments?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch departments" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Unwrap NestJS TransformInterceptor wrapper if present
    const result = data.data !== undefined ? data.data : data;

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withRole(async (request) => {
  try {
    const body = await request.json();

    const response = await fetch(
      `${getExternalApiUrl()}/departments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to create department" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);