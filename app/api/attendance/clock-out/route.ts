import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { employeeId } = body;

    const now = new Date();
    const clockOutTime = now.toTimeString().slice(0, 5);

    const record = {
      id: `att-${Date.now()}`,
      employeeId,
      date: now.toISOString().split("T")[0],
      clockOut: clockOutTime,
      status: "present",
      workHours: 8,
    };

    return NextResponse.json({ success: true, data: record });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to clock out" },
      { status: 500 }
    );
  }
});
