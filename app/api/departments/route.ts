import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/departments?${params.toString()}`, {
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

    // Handle potential double nesting from external API
    const rawDepartments = data.data?.data || data.data || [];
    const rawMeta = data.data?.meta || data.meta;

    // Transform external API data to match frontend interface
    const departments = rawDepartments.map((dept: any) => ({
      id: dept.id,
      name: dept.name || dept.departmentName || dept.title,
      employeeCount: dept.employees?.length || dept.employeeCount || 0,
      percentage: 0,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: departments,
        meta: rawMeta || {
          page,
          limit,
          total: departments.length,
          totalPages: Math.ceil(departments.length / limit),
          hasNext: false,
          hasPrevious: false
        }
      }
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
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/departments`,
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