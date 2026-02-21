import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { ROLES, hasRole } from "@/lib/constants/roles";
import { getAuthSessionFromRequest } from "@/lib/session";

/**
 * GET /api/users/[id]/image
 * Proxy user profile image binary from the external API.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    // Extract user session from cookie to get the external access token
    const user = getAuthSessionFromRequest(request);

    const headers: Record<string, string> = {};
    if (user?.externalAccessToken) {
      headers['Authorization'] = `Bearer ${user.externalAccessToken}`;
    }

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || "http://localhost:3001/api"}/users/${id}/image`,
      { headers }
    );

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";
    const body = await response.arrayBuffer();

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[User Image Proxy GET]", error);
    return new NextResponse(null, { status: 500 });
  }
}

export const POST = withAuth(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;
    
    // Authorization check: Admin, HR Manager, or self
    const isSelf = request.user.id === id;
    const isAuthorized = isSelf || hasRole(request.user.roles, [ROLES.ADMIN, ROLES.HR_MANAGER]);

    if (!isAuthorized) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Unauthorized to update this image",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Valid file is required" },
        { status: 400 }
      );
    }

    // Forward the multipart/form-data to the backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const backendUrl = `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/users/${id}/image`;

    const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
        body: backendFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to upload image";
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.data !== undefined ? data.data : data;
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[User Image Proxy POST]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;

    // Authorization check: Admin, HR Manager, or self
    const isSelf = request.user.id === id;
    const isAuthorized = isSelf || hasRole(request.user.roles, [ROLES.ADMIN, ROLES.HR_MANAGER]);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to remove this image" },
        { status: 403 }
      );
    }

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/users/${id}/image`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to remove image" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("User image delete proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
