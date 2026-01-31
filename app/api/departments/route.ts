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
    params.set("limit", limit.toString());

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/departments?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch departments" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform external API data to match frontend interface
    const departments = (data.data || []).map((dept: any) => ({
      id: dept.id,
      name: dept.name || dept.departmentName,
      employeeCount: dept.employees?.length || 0,
      percentage: 0, // Will be calculated on frontend if needed
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: departments,
        meta: data.meta || {
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
          'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
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

export const PUT = withRole(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Department ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/departments/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to update department" },
        { status: response.status }
      );
    }

    // PUT returns 204 No Content, so we need to fetch the updated department
    const getResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/departments/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        },
      }
    );

    if (!getResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch updated department" },
        { status: getResponse.status }
      );
    }

    const data = await getResponse.json();
    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const DELETE = withRole(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Department ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/departments/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to delete department" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
