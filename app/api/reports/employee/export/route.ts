/**
 * Employee Report Export Endpoint
 * Exports employee data to XLSX or CSV format
 */

import { NextResponse } from "next/server";
import { mockEmployees } from "@/lib/mock-data";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") as "xlsx" | "csv" | null;
  const department = searchParams.get("department");
  const status = searchParams.get("status");

  if (!format || !["xlsx", "csv"].includes(format)) {
    return NextResponse.json(
      { success: false, message: "Format must be 'xlsx' or 'csv'" },
      { status: 400 }
    );
  }

  let employees = [...mockEmployees];

  if (department && department !== "all") {
    employees = employees.filter((emp) => emp.department === department);
  }

  if (status && status !== "all") {
    employees = employees.filter((emp) => emp.status === status);
  }

  // Format data for export
  const exportData = employees.map((emp) => ({
    "Employee ID": emp.employeeId,
    "First Name": emp.firstName,
    "Last Name": emp.lastName,
    "Email": emp.email,
    "Department": emp.department,
    "Position": emp.position,
    "Status": emp.status,
    "Employment Type": emp.employmentType,
    "Hire Date": emp.hireDate,
    "Salary": emp.salary,
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
        "Content-Disposition": `attachment; filename="employees_${Date.now()}.csv"`,
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
