import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId } = body;

    const now = new Date();
    const clockInTime = now.toTimeString().slice(0, 5);
    const isLate = now.getHours() >= 9 && now.getMinutes() > 15;

    const record = {
      id: `att-${Date.now()}`,
      employeeId,
      date: now.toISOString().split("T")[0],
      clockIn: clockInTime,
      status: isLate ? "late" : "present",
      workHours: 0,
    };

    return NextResponse.json({ success: true, data: record });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to clock in" },
      { status: 500 }
    );
  }
}
