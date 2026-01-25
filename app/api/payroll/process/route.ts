import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const POST = withRole(async (request) => {
  try {
    const body = await request.json();
    const { ids } = body;

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      data: ids.map((id: string) => ({ id, status: "processing" })),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to process payroll" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
