import { NextResponse } from "next/server";
import { mockPayrollRecords } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const department = searchParams.get("department");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { success: false, message: "Start date and end date are required" },
      { status: 400 }
    );
  }

  let filteredPayrolls = [...mockPayrollRecords];

  if (department && department !== "all") {
    filteredPayrolls = filteredPayrolls.filter(
      (p) => p.employee?.department === department
    );
  }

  const totalPayroll = filteredPayrolls.reduce((acc, p) => acc + p.netPay, 0);
  const averageSalary = filteredPayrolls.length
    ? totalPayroll / filteredPayrolls.length
    : 0;
  const totalDeductions = filteredPayrolls.reduce(
    (acc, p) => acc + p.deductions,
    0
  );
  const totalAllowances = filteredPayrolls.reduce(
    (acc, p) => acc + p.allowances,
    0
  );

  const deptMap = new Map<string, number>();
  filteredPayrolls.forEach((p) => {
    const dept = p.employee?.department || "Unknown";
    deptMap.set(dept, (deptMap.get(dept) || 0) + p.netPay);
  });
  const departmentPayroll = Array.from(deptMap.entries())
    .map(([department, total]) => ({
      department,
      total: Math.round(total),
    }))
    .sort((a, b) => b.total - a.total);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const payrollTrend = months.slice(0, 6).map((month) => ({
    period: month,
    amount: Math.floor(totalPayroll * (0.9 + Math.random() * 0.2)),
  }));

  const report = {
    totalPayroll: Math.round(totalPayroll),
    averageSalary: Math.round(averageSalary),
    totalDeductions: Math.round(totalDeductions),
    totalAllowances: Math.round(totalAllowances),
    departmentPayroll,
    payrollTrend,
  };

  return NextResponse.json({ success: true, data: report });
}
