import { NextResponse } from "next/server";
import { mockLeaveRequests } from "@/lib/mock-data";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const PUT = withRole(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;
    const body = await request.json();

    const leaveRequest = mockLeaveRequests.find((l) => l.id === id);

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, message: "Leave request not found" },
        { status: 404 }
      );
    }

    const updated = {
      ...leaveRequest,
      ...body,
    };

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update leave request" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
