import { NextResponse } from "next/server";
import { mockPayrollRecords } from "@/lib/mock-data";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async (request) => {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");

  let filtered = [...mockPayrollRecords];

  if (period) {
    filtered = filtered.filter((p) => p.period === period);
  }

  if (status && status !== "all") {
    filtered = filtered.filter((p) => p.status === status);
  }

  if (employeeId) {
    filtered = filtered.filter((p) => p.employeeId === employeeId);
  }

  return NextResponse.json({ success: true, data: filtered });
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
