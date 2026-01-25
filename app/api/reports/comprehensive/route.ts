import { NextResponse } from "next/server";

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

  const baseUrl = new URL(request.url).origin;
  const queryString = searchParams.toString();

  const [attendanceRes, employeeRes, payrollRes, leaveRes] = await Promise.all([
    fetch(`${baseUrl}/api/reports/attendance?${queryString}`),
    fetch(`${baseUrl}/api/reports/employee?${queryString}`),
    fetch(`${baseUrl}/api/reports/payroll?${queryString}`),
    fetch(`${baseUrl}/api/reports/leave?${queryString}`),
  ]);

  const [attendance, employee, payroll, leave] = await Promise.all([
    attendanceRes.json(),
    employeeRes.json(),
    payrollRes.json(),
    leaveRes.json(),
  ]);

  const report = {
    attendance: attendance.data,
    employee: employee.data,
    payroll: payroll.data,
    leave: leave.data,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: report });
}
