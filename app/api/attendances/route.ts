import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getExternalApiUrl } from "@/lib/proxy";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const employeeId = searchParams.get("employeeId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";
  const childIncluded = searchParams.get("childIncluded");

  try {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (employeeId) params.set("employeeId", employeeId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    else if (startDate) params.set("dateFrom", startDate);
    if (dateTo) params.set("dateTo", dateTo);
    else if (endDate) params.set("dateTo", endDate);
    params.set("page", page);
    params.set("limit", limit);
    params.set("pageSize", limit);
    if (childIncluded) params.set("childIncluded", childIncluded);

    const response = await fetch(
      `${getExternalApiUrl()}/attendances?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch attendance records" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Unwrap NestJS TransformInterceptor wrapper if present
    const result = data.data !== undefined ? data.data : data;

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
