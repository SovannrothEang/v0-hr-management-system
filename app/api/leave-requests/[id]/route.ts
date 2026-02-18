import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyDelete, getExternalApiUrl } from "@/lib/proxy";

export const GET = withAuth(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/leave-requests/${id}`, "Failed to fetch leave request");
});

export const PATCH = withRole(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;
    const body = await request.json();

    const response = await fetch(
      `${getExternalApiUrl()}/leave-requests/${id}/status`,
      {
        method: 'PATCH',
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
        { success: false, message: errorData.message || "Failed to update leave request" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data });
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const PUT = PATCH;

export const DELETE = withAuth(async (request, context) => {
  const { id } = await context?.params!;
  return proxyDelete(request, `/leave-requests/${id}`, "Failed to delete leave request");
});
