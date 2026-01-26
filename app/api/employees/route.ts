import { NextResponse } from "next/server";
import { mockEmployees, departments } from "@/lib/mock-data";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase();
  const department = searchParams.get("department");
  const status = searchParams.get("status");

  let filtered = [...mockEmployees];

  // HR Manager can only see their department
  if (request.user.roles.includes(ROLES.HR_MANAGER) && !request.user.roles.includes(ROLES.ADMIN) && request.user.department) {
    filtered = filtered.filter((e) => e.department === request.user.department);
  }

  if (search) {
    filtered = filtered.filter(
      (e) =>
        e.firstName.toLowerCase().includes(search) ||
        e.lastName.toLowerCase().includes(search) ||
        e.email.toLowerCase().includes(search) ||
        e.employeeId.toLowerCase().includes(search)
    );
  }

  if (department && department !== "all") {
    filtered = filtered.filter((e) => e.department === department);
  }

  if (status && status !== "all") {
    filtered = filtered.filter((e) => e.status === status);
  }

  return NextResponse.json({ success: true, data: filtered });
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const POST = withRole(async (request) => {
  try {
    const body = await request.json();
    const newEmployee = {
      ...body,
      id: `emp-${Date.now()}`,
      employeeId: `EMP${String(mockEmployees.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: newEmployee });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create employee" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
