import { NextResponse } from "next/server";
import { mockEmployees } from "@/lib/mock-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { period } = body;

    const payrollRecords = mockEmployees.map((emp, index) => ({
      id: `payroll-gen-${Date.now()}-${index}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      period,
      baseSalary: emp.salary / 12,
      overtime: 0,
      bonus: 0,
      deductions: Math.floor((emp.salary / 12) * 0.05),
      tax: Math.floor((emp.salary / 12) * 0.22),
      netSalary: Math.floor((emp.salary / 12) * 0.73),
      status: "draft",
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, data: payrollRecords });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to generate payroll" },
      { status: 500 }
    );
  }
}
