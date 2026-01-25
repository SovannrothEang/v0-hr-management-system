import { NextResponse } from "next/server";
import { mockPayrollRecords } from "@/lib/mock-data";

export async function GET() {
  const summary = {
    totalPayroll: mockPayrollRecords.reduce((acc, p) => acc + p.netPay, 0),
    totalEmployees: mockPayrollRecords.length,
    totalOvertimePaid: mockPayrollRecords.reduce((acc, p) => acc + p.allowances, 0),
    totalBonuses: 0, // No bonus field, set to 0
    totalDeductions: mockPayrollRecords.reduce((acc, p) => acc + p.deductions, 0),
    averageSalary:
      mockPayrollRecords.reduce((acc, p) => acc + p.netPay, 0) /
      mockPayrollRecords.length,
  };

  return NextResponse.json({ success: true, data: summary });
}
