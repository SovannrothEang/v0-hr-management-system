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
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/users/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "User not found" },
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
}, [ROLES.ADMIN]);

export const PUT = withRole(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;
    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/users/${id}`,
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
      return NextResponse.json(
        { success: false, message: "Failed to update user" },
        { status: response.status }
      );
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
    const changes = await request.json();

    // Transform frontend changes to backend UserUpdateDto
    const backendPayload: any = {};
    if (changes.email !== undefined) {
      backendPayload.email = changes.email;
      // Also update username if email changed (username is email)
      backendPayload.username = changes.email;
    }
    // Note: frontend firstName, lastName, roles, isActive are not supported in backend UserUpdateDto
    // Could be extended in future

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/users/${id}`,
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

    const data = await response.json();
    return NextResponse.json({ success: true, data: data });
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
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/users/${id}`,
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