import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { getAuthSessionFromRequest } from "@/lib/session";

/**
 * GET /api/employees/[id]/image
 * Proxy employee profile image binary from the external API.
 * Extracts the auth token from the cookie and forwards it to the external API.
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
      `${process.env.EXTERNAL_API_URL || "http://localhost:3001/api"}/employees/${id}/image`,
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
    console.error("[Employee Image Proxy GET]", error);
    return new NextResponse(null, { status: 500 });
  }
}

export const POST = withRole(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File is required" },
        { status: 400 }
      );
    }

    // Forward the multipart/form-data to the backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/employees/${id}/image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
        body: backendFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend image upload error:", response.status, errorText);
      return NextResponse.json(
        { success: false, message: "Failed to upload image" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.data !== undefined ? data.data : data;
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Image upload proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const DELETE = withRole(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/employees/${id}/image`,
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
    console.error("Image delete proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
