/**
 * Payroll Report Export Endpoint
 * Exports payroll data to XLSX or CSV format
 */

import { NextResponse } from "next/server";
import { mockPayrollRecords } from "@/lib/mock-data";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") as "xlsx" | "csv" | null;
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const department = searchParams.get("department");
  const status = searchParams.get("status");

  if (!format || !["xlsx", "csv"].includes(format)) {
    return NextResponse.json(
      { success: false, message: "Format must be 'xlsx' or 'csv'" },
      { status: 400 }
    );
  }

  let payrolls = [...mockPayrollRecords];

  if (year) {
    payrolls = payrolls.filter((p) => p.year === parseInt(year));
  }

  if (month) {
    payrolls = payrolls.filter((p) => p.month.toLowerCase() === month.toLowerCase());
  }

  if (department && department !== "all") {
    payrolls = payrolls.filter((p) => p.employee?.department === department);
  }

  if (status && status !== "all") {
    payrolls = payrolls.filter((p) => p.status === status);
  }

  // Format data for export
  const exportData = payrolls.map((payroll) => ({
    "Payroll ID": payroll.id,
    "Employee ID": payroll.employeeId,
    "Employee Name": payroll.employee ? `${payroll.employee.firstName} ${payroll.employee.lastName}` : "",
    "Department": payroll.employee?.department || "",
    "Period": payroll.period,
    "Month": payroll.month,
    "Year": payroll.year,
    "Basic Salary": payroll.basicSalary,
    "Allowances": payroll.allowances,
    "Deductions": payroll.deductions,
    "Net Pay": payroll.netPay,
    "Status": payroll.status,
    "Processed At": payroll.processedAt || "",
  }));

  if (format === "csv") {
    // Generate CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="payroll_${Date.now()}.csv"`,
      },
    });
  } else {
    // For XLSX, we would need a library like xlsx
    // For now, return JSON as a fallback
    return NextResponse.json(
      {
        success: true,
        message: "XLSX export requires additional library. Use CSV format instead.",
        data: exportData,
      },
      { status: 200 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
