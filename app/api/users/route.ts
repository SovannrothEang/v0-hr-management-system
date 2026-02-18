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

  // Always include employee relations so we can resolve avatars
  params.set("includeEmployees", "true");

  try {
    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/users?${params.toString()}`,
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

    // Handle empty response (should not happen for GET, but guard)
    const responseContentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || contentLength === '0' || !responseContentType?.includes('application/json')) {
      // Return empty array for list endpoint
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const data = await response.json();

    // Unwrap NestJS TransformInterceptor wrapper if present
    const result = data.data !== undefined ? data.data : data;

    return NextResponse.json({
      success: true,
      data: result
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
    // Check if request body exists
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: "Content-Type must be application/json" },
        { status: 415 }
      );
    }
    
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("Invalid JSON in request body:", jsonError);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

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
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/users`
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

    // Handle empty response (e.g., 204 No Content)
    const responseContentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || contentLength === '0' || !responseContentType?.includes('application/json')) {
      // Return success with null data (unlikely for POST, but handle gracefully)
      return NextResponse.json({ success: true, data: null });
    }

    const data = await response.json();
    const result = data.data !== undefined ? data.data : data;
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create user" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);