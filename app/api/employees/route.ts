import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const department = searchParams.get("department");
  const status = searchParams.get("status");
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  try {
    const params = new URLSearchParams();
    params.set("includeDetails", "true");
    params.set("page", page);
    params.set("limit", limit);

    if (search) {
      params.set("search", search);
    }

    if (department && department !== "all") {
      params.set("department", department);
    }

    if (status && status !== "all") {
      const upperStatus = status.toUpperCase();
      params.set("status", upperStatus);
    }

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/employees?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch employees" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.data || data;

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
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const POST = withRole(async (request) => {
  try {
    const body = await request.json();

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/employees`,
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
      return NextResponse.json(
        { success: false, message: "Failed to create employee" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create employee" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
