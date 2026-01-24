import { NextResponse } from "next/server";
import { mockPayrollRecords } from "@/lib/mock-data";

export async function GET() {
  const summary = {
    totalPayroll: mockPayrollRecords.reduce((acc, p) => acc + p.netSalary, 0),
    totalEmployees: mockPayrollRecords.length,
    totalOvertimePaid: mockPayrollRecords.reduce((acc, p) => acc + p.overtime, 0),
    totalBonuses: mockPayrollRecords.reduce((acc, p) => acc + p.bonus, 0),
    totalDeductions: mockPayrollRecords.reduce((acc, p) => acc + p.deductions, 0),
    averageSalary:
      mockPayrollRecords.reduce((acc, p) => acc + p.netSalary, 0) /
      mockPayrollRecords.length,
  };

  return NextResponse.json({ success: true, data: summary });
}
