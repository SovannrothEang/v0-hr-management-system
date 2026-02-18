import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);

  // Supported query parameters for backend
  const allowedParams = [
    "search",
    "page",
    "limit",
    "role",
    "isActive",
    "createdAtFrom",
    "createdAtTo",
    "sortBy",
    "sortOrder",
  ];

  const params = new URLSearchParams();

  for (const key of allowedParams) {
    const value = searchParams.get(key);
    if (value !== null && value !== "") {
      // Transform role values from lowercase to uppercase
      if (key === "role") {
        params.set(key, value.toUpperCase());
      } else {
        params.set(key, value);
      }
    }
  }

  // Ensure page and limit have defaults
  if (!searchParams.has("page")) params.set("page", "1");
  if (!searchParams.has("limit")) params.set("limit", "10");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/users?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        { success: false, message: "Failed to fetch users" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the external API response directly
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);

export const POST = withRole(async (request) => {
  try {
    const body = await request.json();

    // Transform frontend payload to backend UserCreateDto
    const backendPayload: any = {
      username: body.email, // Use email as username
      email: body.email,
      password: body.password || "TempPassword123!", // Required by backend
    };

    // Determine role from frontend roles array
    let role = "ADMIN";
    if (body.roles && Array.isArray(body.roles) && body.roles.length > 0) {
      // Map frontend role values to backend RoleName enum
      const frontendRole = body.roles[0].toUpperCase();
      if (frontendRole === "HR_MANAGER") {
        role = "HR"; // Map HR_MANAGER to HR
      } else if (frontendRole === "ADMIN" || frontendRole === "EMPLOYEE") {
        role = frontendRole;
      }
    }

    // Build URL with role query parameter
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/users`
    );
    url.searchParams.set("role", role);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
      },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        { success: false, message: "Failed to create user" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create user" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);