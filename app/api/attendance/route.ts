import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const employeeId = searchParams.get("employeeId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  try {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (employeeId) params.set("employeeId", employeeId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", page);
    params.set("limit", limit);
    params.set("pageSize", limit);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/attendance?${params.toString()}`,
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
    
    const rawAttendance = data.data?.data || data.data || [];
    const rawTotal = data.data?.total ?? data.total;
    const rawPage = data.data?.page ?? data.page;
    const rawLimit = data.data?.limit ?? data.limit;
    const rawTotalPages = data.data?.totalPages ?? data.totalPages;
    const rawHasNext = data.data?.hasNext ?? data.hasNext;
    const rawHasPrevious = data.data?.hasPrevious ?? data.hasPrevious;

    const rawMeta = rawTotal !== undefined ? {
      total: rawTotal,
      page: rawPage,
      limit: rawLimit,
      totalPages: rawTotalPages,
      hasNext: rawHasNext,
      hasPrevious: rawHasPrevious,
    } : data.meta;

    return NextResponse.json({
      success: true,
      data: {
        data: rawAttendance,
        meta: rawMeta
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
