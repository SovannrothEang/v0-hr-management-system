import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  try {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (employeeId) params.set("employeeId", employeeId);
    params.set("page", page);
    params.set("limit", limit);
    params.set("pageSize", limit);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/takeleave?${params.toString()}`,
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

    // The API returns ResultPagination which has flat meta properties
    const rawRequests = responseData.data?.data || responseData.data || [];
    const rawTotal = responseData.data?.total ?? responseData.total;
    const rawPage = responseData.data?.page ?? responseData.page;
    const rawLimit = responseData.data?.limit ?? responseData.limit;
    const rawTotalPages = responseData.data?.totalPages ?? responseData.totalPages;
    const rawHasNext = responseData.data?.hasNext ?? responseData.hasNext;
    const rawHasPrevious = responseData.data?.hasPrevious ?? responseData.hasPrevious;

    const rawMeta = rawTotal !== undefined ? {
      total: rawTotal,
      page: rawPage,
      limit: rawLimit,
      totalPages: rawTotalPages,
      hasNext: rawHasNext,
      hasPrevious: rawHasPrevious,
    } : responseData.meta;

    return NextResponse.json({
      success: true,
      data: {
        data: rawRequests,
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

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/takeleave`,
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
