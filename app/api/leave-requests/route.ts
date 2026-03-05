import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getExternalApiUrl } from "@/lib/proxy";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");
  const search = searchParams.get("search");
  const leaveType = searchParams.get("leaveType");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  try {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (employeeId) params.set("employeeId", employeeId);
    if (search) params.set("search", search);
    if (leaveType && leaveType !== "all") params.set("leaveType", leaveType);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", page);
    params.set("limit", limit);
    params.set("pageSize", limit);

    const response = await fetch(
      `${getExternalApiUrl()}/leave-requests?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch leave requests" },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    // Unwrap NestJS TransformInterceptor wrapper if present
    const result = responseData.data !== undefined ? responseData.data : responseData;

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
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();

    const response = await fetch(
      `${getExternalApiUrl()}/leave-requests`,
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
        { success: false, message: "Failed to create leave request" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create leave request" },
      { status: 500 }
    );
  }
});
