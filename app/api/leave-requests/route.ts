import { NextResponse } from "next/server";
import { mockLeaveRequests } from "@/lib/mock-data";
import { withAuth } from "@/lib/auth/with-auth";
import { ROLES } from "@/lib/constants/roles";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");

  let filtered = [...mockLeaveRequests];

  // Employees can only see their own leave requests
  if (request.user.role === ROLES.EMPLOYEE) {
    filtered = filtered.filter((l) => l.employeeId === request.user.employeeId);
  }

  if (status && status !== "all") {
    filtered = filtered.filter((l) => l.status === status);
  }

  if (employeeId) {
    filtered = filtered.filter((l) => l.employeeId === employeeId);
  }

  return NextResponse.json({ success: true, data: filtered });
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();

    const newRequest = {
      ...body,
      id: `leave-${Date.now()}`,
      employeeId: request.user.employeeId || request.user.id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: newRequest });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create leave request" },
      { status: 500 }
    );
  }
});
