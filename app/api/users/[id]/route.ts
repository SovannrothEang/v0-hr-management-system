import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (
  request,
  context
) => {
  const { id } = await context?.params!;

  try {
    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/users/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend GET error:", response.status, errorText);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: response.status }
      );
    }

    // Handle empty response (should not happen for GET, but guard)
    const responseContentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || contentLength === '0' || !responseContentType?.includes('application/json')) {
      // Return null for single user endpoint
      return NextResponse.json({ success: true, data: null });
    }

    const data = await response.json();
    const result = data.data !== undefined ? data.data : data;
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);

export const PUT = withRole(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;

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

    // Validate that body is not empty
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: "No update data provided" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/users/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend PUT error:", response.status, errorText);
      return NextResponse.json(
        { success: false, message: "Failed to update user" },
        { status: response.status }
      );
    }

    // Handle empty response (e.g., 204 No Content)
    const responseContentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || contentLength === '0' || !responseContentType?.includes('application/json')) {
      // Return success with null data
      return NextResponse.json({ success: true, data: null });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update user" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);

export const PATCH = withRole(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;

    // Check if request body exists
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    let changes;
    try {
      changes = await request.json();
    } catch (jsonError) {
      console.error("Invalid JSON in request body:", jsonError);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate that changes object is not empty
    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update provided" },
        { status: 400 }
      );
    }

    // Transform frontend changes to backend UserUpdateDto
    const backendPayload: any = {};
    if (changes.email !== undefined) {
      backendPayload.email = changes.email;
      // Also update username if email changed (username is email)
      backendPayload.username = changes.email;
    }

    // Support roles update
    if (changes.roles !== undefined && Array.isArray(changes.roles) && changes.roles.length > 0) {
      backendPayload.roles = [changes.roles[0].toUpperCase()];
    }

    // Support isActive update
    if (changes.isActive !== undefined) {
      backendPayload.isActive = Boolean(changes.isActive);
    }

    // Check if backendPayload is empty after transformation
    if (Object.keys(backendPayload).length === 0) {
      console.warn(`PATCH /api/users/${id}: No supported fields to update. Received fields:`, Object.keys(changes));
      return NextResponse.json(
        {
          success: false,
          message: `Only email, roles, and isActive can be updated via this endpoint. Received fields: ${Object.keys(changes).join(', ')}`
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/users/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
        body: JSON.stringify(backendPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend PATCH error:", response.status, errorText);
      return NextResponse.json(
        { success: false, message: "Failed to update user" },
        { status: response.status }
      );
    }

    // Handle empty response (e.g., 204 No Content)
    const responseContentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || contentLength === '0' || !responseContentType?.includes('application/json')) {
      // Return success with null data
      return NextResponse.json({ success: true, data: null });
    }

    // Parse JSON response
    const data = await response.json();
    const result = data.data !== undefined ? data.data : data;
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("PATCH user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);

export const DELETE = withRole(async (
  request,
  context
) => {
  const { id } = await context?.params!;

  try {
    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/users/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to delete user" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);