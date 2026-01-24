import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    return NextResponse.json({
      success: true,
      data: ids.map((id: string) => ({
        id,
        status: "paid",
        paidAt: new Date().toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to mark payroll as paid" },
      { status: 500 }
    );
  }
}
