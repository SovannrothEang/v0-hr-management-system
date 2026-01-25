import { NextResponse } from "next/server";
import { mockAttendanceRecords, mockEmployees } from "@/lib/mock-data";
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

  let filteredRecords = mockAttendanceRecords.filter(
    (record) => record.date >= startDate && record.date <= endDate
  );

  if (department && department !== "all") {
    const deptEmployeeIds = mockEmployees
      .filter((emp) => emp.department === department)
      .map((emp) => emp.id);
    filteredRecords = filteredRecords.filter((record) =>
      deptEmployeeIds.includes(record.employeeId)
    );
  }

  const totalDays = filteredRecords.length;
  const presentDays = filteredRecords.filter(
    (r) => r.status === "present"
  ).length;
  const lateDays = filteredRecords.filter((r) => r.status === "late").length;
  const absentDays = filteredRecords.filter(
    (r) => r.status === "absent"
  ).length;
  const leaveDays = filteredRecords.filter(
    (r) => r.status === "on_leave"
  ).length;

  const workHoursRecords = filteredRecords.filter((r) => r.workHours);
  const totalWorkHours = workHoursRecords.reduce(
    (acc, r) => acc + (r.workHours || 0),
    0
  );
  const averageWorkHours = workHoursRecords.length
    ? totalWorkHours / workHoursRecords.length
    : 0;

  const totalOvertimeHours = filteredRecords.reduce(
    (acc, r) => acc + (r.overtime || 0),
    0
  );

  const attendanceRate =
    totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0;

  const report = {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    leaveDays,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    averageWorkHours: Math.round(averageWorkHours * 10) / 10,
    totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
  };

  return NextResponse.json({ success: true, data: report });
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
