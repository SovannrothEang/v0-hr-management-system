import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";
import { getExternalApiUrl } from "@/lib/proxy";

export const GET = withRole(async (request, context) => {
  const { id } = await context?.params!;

  try {
    const response = await fetch(
      `${getExternalApiUrl()}/payrolls/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch payroll" },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    const payroll = responseData.data || responseData;

    const startDate = new Date(payroll.payPeriodStart);
    const monthName = startDate.toLocaleString('default', { month: 'long' });
    const year = startDate.getFullYear();

    const overtimePay = Number(payroll.overtimeHrs || 0) * Number(payroll.overtimeRate || 0);
    const basicSalary = Number(payroll.basicSalary || 0);
    const bonus = Number(payroll.bonus || 0);
    const items = payroll.items || [];

    const transformedPayroll = {
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
      currencyCode: payroll.currencyCode || 'USD',
      baseCurrencyCode: payroll.baseCurrencyCode,
      payPeriodStart: payroll.payPeriodStart,
      payPeriodEnd: payroll.payPeriodEnd,
      paymentDate: payroll.paymentDate,
      period: `${monthName} ${year}`,
      month: monthName,
      year: year,
      basicSalary: basicSalary,
      overtimeHrs: Number(payroll.overtimeHrs || 0),
      overtimeRate: Number(payroll.overtimeRate || 0),
      overtimePay: overtimePay,
      bonus: bonus,
      grossSalary: basicSalary + overtimePay + bonus,
      allowances: items
        .filter((item: any) => item.itemType === 'EARNING' && item.itemName.toLowerCase() !== 'basic salary')
        .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0),
      deductions: Number(payroll.deductions || 0),
      netSalary: Number(payroll.netSalary || 0),
      netPay: Number(payroll.netSalary || 0),
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

    return NextResponse.json({
      success: true,
      data: transformedPayroll
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.EMPLOYEE]);

export const DELETE = withRole(async (request, context) => {
  const { id } = await context?.params!;
  const metadata = getRequestMetadata(request);

  try {
    const response = await fetch(
      `${getExternalApiUrl()}/payrolls/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      logAuditEvent(AuditAction.PAYROLL_DELETED, request.user, {
        ...metadata,
        resource: 'payroll',
        resourceId: id,
        success: false,
        errorMessage: errorData.message || 'Failed to delete payroll',
      });

      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to delete payroll" },
        { status: response.status }
      );
    }

    logAuditEvent(AuditAction.PAYROLL_DELETED, request.user, {
      ...metadata,
      resource: 'payroll',
      resourceId: id,
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logAuditEvent(AuditAction.PAYROLL_DELETED, request.user, {
      ...metadata,
      resource: 'payroll',
      resourceId: id,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, message: "Failed to delete payroll" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
