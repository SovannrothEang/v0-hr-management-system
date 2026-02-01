import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");

  try {
    const params = new URLSearchParams();
    if (period) params.set("period", period);
    if (status && status !== "all") params.set("status", status);
    if (employeeId) params.set("employeeId", employeeId);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/payroll?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch payroll records" },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    // Correctly handle the API's ResultPagination structure
    const rawPayroll = responseData.data?.data || responseData.data || [];
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
        data: rawPayroll,
        meta: rawMeta
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
