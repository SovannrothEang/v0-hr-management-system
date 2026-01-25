import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
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
  
  // Get auth header to forward to internal requests
  const authHeader = request.headers.get('authorization');
  const headers: Record<string, string> = authHeader ? { 'Authorization': authHeader } : {};

  const [attendanceRes, employeeRes, payrollRes, leaveRes] = await Promise.all([
    fetch(`${baseUrl}/api/reports/attendance?${queryString}`, { headers }),
    fetch(`${baseUrl}/api/reports/employee?${queryString}`, { headers }),
    fetch(`${baseUrl}/api/reports/payroll?${queryString}`, { headers }),
    fetch(`${baseUrl}/api/reports/leave?${queryString}`, { headers }),
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
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
