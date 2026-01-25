import { NextResponse } from "next/server";
import { mockEmployees } from "@/lib/mock-data";
import type { PayrollRecord } from "@/types";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const POST = withRole(async (request) => {
  try {
    const body = await request.json();
    const { month, year } = body;
    const period = `${month} ${year}`;

    const payrollRecords: PayrollRecord[] = mockEmployees
      .filter((emp) => emp.status === "active")
      .map((emp, index) => ({
        id: `payroll-gen-${Date.now()}-${index}`,
        employeeId: emp.id,
        employee: emp,
        period,
        month,
        year,
        basicSalary: emp.salary / 12,
        allowances: Math.random() > 0.7 ? Math.floor(Math.random() * 500) : 0,
        deductions: Math.floor((emp.salary / 12) * 0.05),
        netPay: Math.floor((emp.salary / 12) * 0.95),
        status: "pending" as const,
        processedAt: undefined,
        paidAt: undefined,
      }));

    return NextResponse.json({ success: true, data: payrollRecords });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to generate payroll" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
