import { NextResponse } from "next/server";
import { mockEmployees } from "@/lib/mock-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const employee = mockEmployees.find((e) => e.id === id);

  if (!employee) {
    return NextResponse.json(
      { success: false, message: "Employee not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: employee });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const employee = mockEmployees.find((e) => e.id === id);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
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
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const employee = mockEmployees.find((e) => e.id === id);

  if (!employee) {
    return NextResponse.json(
      { success: false, message: "Employee not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
