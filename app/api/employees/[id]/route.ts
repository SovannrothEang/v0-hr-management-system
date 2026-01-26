import { NextResponse } from "next/server";
import { mockEmployees } from "@/lib/mock-data";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (
  request,
  context
) => {
  const { id } = await context?.params!;
  const employee = mockEmployees.find((e) => e.id === id);

  if (!employee) {
    return NextResponse.json(
      { success: false, message: "Employee not found" },
      { status: 404 }
    );
  }

  // HR Manager can only view employees in their department
  if (request.user.roles.includes(ROLES.HR_MANAGER) && !request.user.roles.includes(ROLES.ADMIN) && request.user.department) {
    if (employee.department !== request.user.department) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({ success: true, data: employee });
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const PUT = withRole(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;
    const body = await request.json();
    const employee = mockEmployees.find((e) => e.id === id);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // HR Manager can only update employees in their department
    if (request.user.roles.includes(ROLES.HR_MANAGER) && !request.user.roles.includes(ROLES.ADMIN) && request.user.department) {
      if (employee.department !== request.user.department) {
        return NextResponse.json(
          { success: false, message: "Access denied" },
          { status: 403 }
        );
      }
    }

    const updatedEmployee = {
      ...employee,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: updatedEmployee });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update employee" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const DELETE = withRole(async (
  request,
  context
) => {
  const { id } = await context?.params!;
  const employee = mockEmployees.find((e) => e.id === id);

  if (!employee) {
    return NextResponse.json(
      { success: false, message: "Employee not found" },
      { status: 404 }
    );
  }

  // HR Manager can only delete employees in their department
  if (request.user.roles.includes(ROLES.HR_MANAGER) && !request.user.roles.includes(ROLES.ADMIN) && request.user.department) {
    if (employee.department !== request.user.department) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({ success: true, data: null });
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
