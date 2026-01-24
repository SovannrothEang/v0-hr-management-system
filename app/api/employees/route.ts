import { NextResponse } from "next/server";
import { mockEmployees, departments } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase();
  const department = searchParams.get("department");
  const status = searchParams.get("status");

  let filtered = [...mockEmployees];

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
}

export async function POST(request: Request) {
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
}
