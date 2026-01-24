import { NextResponse } from "next/server";
import { mockLeaveRequests } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");

  let filtered = [...mockLeaveRequests];

  if (status && status !== "all") {
    filtered = filtered.filter((l) => l.status === status);
  }

  if (employeeId) {
    filtered = filtered.filter((l) => l.employeeId === employeeId);
  }

  return NextResponse.json({ success: true, data: filtered });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newRequest = {
      ...body,
      id: `leave-${Date.now()}`,
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
}
