import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { getExternalApiUrl } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  try {
    const params = new URLSearchParams();
    if (period) params.set("period", period);
    if (status && status !== "all") params.set("status", status);
    if (employeeId) params.set("employeeId", employeeId);
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    const response = await fetch(
      `${getExternalApiUrl()}/payrolls?${params.toString()}`,
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
    const backendData = responseData.data;

    // Transform backend data to match frontend types
    const transformedData = {
      ...backendData,
      data: backendData.data.map((payroll: any) => {
        const startDate = new Date(payroll.payPeriodStart);
        const monthName = startDate.toLocaleString('default', { month: 'long' });
        const year = startDate.getFullYear();

        return {
          id: payroll.id,
          employeeId: payroll.employeeId,
          employee: payroll.employee ? {
            id: payroll.employee.id,
            employeeId: payroll.employee.employeeCode,
            firstName: payroll.employee.firstname,
            lastName: payroll.employee.lastname,
            email: payroll.employee.email,
            phone: payroll.employee.phone,
            department: payroll.employee.department?.departmentName || 'N/A',
            position: payroll.employee.position?.title || 'N/A',
            status: payroll.employee.status?.toLowerCase() || 'active',
            avatar: (payroll.employee.userId || payroll.employee.user?.id) ? `/api/users/${payroll.employee.userId || payroll.employee.user?.id}/image` : undefined,
            salary: Number(payroll.employee.position?.salaryRangeMin || 0),
          } : undefined,
          period: `${monthName} ${year}`,
          month: monthName,
          year: year,
          basicSalary: Number(payroll.basicSalary || 0),
          allowances: Number(payroll.bonus || 0),
          deductions: Number(payroll.deductions || 0),
          netPay: Number(payroll.netSalary || 0),
          status: payroll.status.toLowerCase(),
          processedAt: payroll.processedAt,
          paidAt: payroll.paymentDate,
        };
      })
    };

    return NextResponse.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
