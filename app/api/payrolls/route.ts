import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { getExternalApiUrl } from "@/lib/proxy";

function getAvatarUrl(userId?: string | null, profileImage?: string | null): string | undefined {
  if (!userId || !profileImage) return undefined;
  return `/api/users/${userId}/image`;
}

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");

  try {
    const params = new URLSearchParams();
    if (period) params.set("period", period);
    if (status && status !== "all") params.set("status", status);
    if (employeeId) params.set("employeeId", employeeId);
    if (month) params.set("month", month);
    if (year) params.set("year", year);
    if (page) params.set("page", page);
    if (limit) params.set("limit", limit);

    const summaryParams = new URLSearchParams();
    if (month) summaryParams.set("month", month);
    if (year) summaryParams.set("year", year);

    const authHeader = {
      'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
    };

    const [payrollsResponse, summaryResponse] = await Promise.all([
      fetch(`${getExternalApiUrl()}/payrolls?${params.toString()}`, { headers: authHeader }),
      fetch(`${getExternalApiUrl()}/payrolls/summary?${summaryParams.toString()}`, { headers: authHeader }),
    ]);

    if (!payrollsResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch payroll records" },
        { status: payrollsResponse.status }
      );
    }

    const responseData = await payrollsResponse.json();
    const backendData = responseData.data || responseData;
    const payrollRecords = Array.isArray(backendData.data) ? backendData.data : (Array.isArray(backendData) ? backendData : []);

    let summary = null;
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      summary = summaryData.data || summaryData;
      if (summary.byStatus) {
        summary.byStatus = summary.byStatus.map((s: any) => ({
          ...s,
          status: s.status?.toUpperCase() || s.status,
        }));
      }
    }

    const transformedPayrolls = payrollRecords.map((payroll: any) => {
      const startDate = new Date(payroll.payPeriodStart);
      const monthName = startDate.toLocaleString('default', { month: 'long' });
      const yearVal = startDate.getFullYear();

      const overtimePay = Number(payroll.overtimeHrs || 0) * Number(payroll.overtimeRate || 0);
      const basicSalary = Number(payroll.basicSalary || 0);
      const bonus = Number(payroll.bonus || 0);
      const items = payroll.items || [];

      const earningsItems = items.filter((item: any) => item.itemType === 'EARNING');
      const totalAllowances = earningsItems.reduce((sum: number, item: any) => {
        if (item.itemName.toLowerCase() !== 'basic salary') {
          return sum + Number(item.amount || 0);
        }
        return sum;
      }, 0);

      return {
        id: payroll.id,
        employeeId: payroll.employeeId,
        employee: payroll.employee ? {
          id: payroll.employee.id,
          employeeId: payroll.employee.employeeCode,
          firstName: payroll.employee.firstname,
          lastName: payroll.employee.lastname,
          email: payroll.employee.user?.email || payroll.employee.email,
          phone: payroll.employee.phoneNumber || payroll.employee.phone,
          department: payroll.employee.department?.name || payroll.employee.department?.departmentName || 'N/A',
          position: payroll.employee.position?.title || 'N/A',
          status: payroll.employee.status?.toLowerCase() || 'active',
          avatar: getAvatarUrl(
            payroll.employee.userId || payroll.employee.user?.id,
            payroll.employee.profileImage || payroll.employee.user?.profileImage
          ),
          salary: Number(payroll.employee.position?.salaryRangeMin || payroll.employee.salary || 0),
        } : undefined,
        currencyCode: payroll.currencyCode || 'USD',
        baseCurrencyCode: payroll.baseCurrencyCode,
        payPeriodStart: payroll.payPeriodStart,
        payPeriodEnd: payroll.payPeriodEnd,
        paymentDate: payroll.paymentDate,
        period: `${monthName} ${yearVal}`,
        month: monthName,
        year: yearVal,
        basicSalary: basicSalary,
        overtimeHrs: Number(payroll.overtimeHrs || 0),
        overtimeRate: Number(payroll.overtimeRate || 0),
        overtimePay: overtimePay,
        bonus: bonus,
        allowances: totalAllowances,
        deductions: Number(payroll.deductions || 0),
        netSalary: Number(payroll.netSalary || 0),
        netPay: Number(payroll.netSalary || 0),
        grossSalary: basicSalary + overtimePay + bonus,
        status: payroll.status.toLowerCase(),
        exchangeRate: payroll.exchangeRate ? Number(payroll.exchangeRate) : undefined,
        baseCurrencyAmount: payroll.baseCurrencyAmount ? Number(payroll.baseCurrencyAmount) : undefined,
        processedAt: payroll.processedAt,
        paidAt: payroll.paymentDate,
        createdAt: payroll.createdAt,
        updatedAt: payroll.updatedAt,
        items: items.map((item: any) => ({
          id: item.id,
          payrollId: item.payrollId,
          itemType: item.itemType,
          itemName: item.itemName,
          amount: Number(item.amount || 0),
          currencyCode: item.currencyCode,
          description: item.description,
        })),
        taxCalculation: payroll.taxCalculation ? {
          id: payroll.taxCalculation.id,
          grossIncome: Number(payroll.taxCalculation.grossIncome || 0),
          taxableIncome: Number(payroll.taxCalculation.taxableIncome || 0),
          taxAmount: Number(payroll.taxCalculation.taxAmount || 0),
          taxRateUsed: Number(payroll.taxCalculation.taxRateUsed || 0),
          taxBracketId: payroll.taxCalculation.taxBracketId,
        } : undefined,
      };
    });

    const meta = {
      total: backendData.meta?.total ?? backendData.total ?? transformedPayrolls.length,
      page: backendData.meta?.page ?? backendData.page ?? parseInt(page || "1"),
      limit: backendData.meta?.limit ?? backendData.limit ?? parseInt(limit || "10"),
      totalPages: backendData.meta?.totalPages ?? backendData.totalPages ?? Math.ceil((backendData.meta?.total ?? transformedPayrolls.length) / (parseInt(limit || "10"))),
      hasNext: backendData.meta?.hasNext ?? false,
      hasPrevious: backendData.meta?.hasPrevious ?? false,
    };

    return NextResponse.json({
      success: true,
      data: {
        data: transformedPayrolls,
        meta,
        summary,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
