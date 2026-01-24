import { NextResponse } from "next/server";
import { mockPayrollRecords } from "@/lib/mock-data";

export async function GET(request: Request) {
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
}
