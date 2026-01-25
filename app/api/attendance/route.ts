import { NextResponse } from "next/server";
import { mockAttendanceRecords } from "@/lib/mock-data";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const employeeId = searchParams.get("employeeId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let filtered = [...mockAttendanceRecords];

  if (date) {
    filtered = filtered.filter((a) => a.date === date);
  }

  if (employeeId) {
    filtered = filtered.filter((a) => a.employeeId === employeeId);
  }

  if (startDate && endDate) {
    filtered = filtered.filter((a) => a.date >= startDate && a.date <= endDate);
  }

  return NextResponse.json({ success: true, data: filtered });
});
