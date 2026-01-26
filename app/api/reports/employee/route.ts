import { NextResponse } from "next/server";
import { mockEmployees } from "@/lib/mock-data";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");

  let employees = [...mockEmployees];

  if (department && department !== "all") {
    employees = employees.filter((emp) => emp.department === department);
  }

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const onLeaveEmployees = employees.filter(
    (e) => e.status === "on_leave"
  ).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newHires = employees.filter(
    (e) => new Date(e.hireDate) >= thirtyDaysAgo
  ).length;

  const terminatedEmployees = employees.filter(
    (e) => e.status === "inactive"
  ).length;

  const departmentMap = new Map<string, number>();
  employees.forEach((emp) => {
    departmentMap.set(emp.department, (departmentMap.get(emp.department) || 0) + 1);
  });
  const departmentBreakdown = Array.from(departmentMap.entries()).map(
    ([department, count]) => ({
      department,
      count,
    })
  );

  const positionMap = new Map<string, number>();
  employees.forEach((emp) => {
    positionMap.set(emp.position, (positionMap.get(emp.position) || 0) + 1);
  });
  const positionBreakdown = Array.from(positionMap.entries())
    .map(([position, count]) => ({
      position,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const report = {
    totalEmployees,
    activeEmployees,
    onLeaveEmployees,
    newHires,
    terminatedEmployees,
    departmentBreakdown,
    positionBreakdown,
  };

  return NextResponse.json({ success: true, data: report });
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
