import { NextResponse } from "next/server";
import { mockRecentActivity } from "@/lib/mock-data";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const GET = withRole(async () => {
  return NextResponse.json({ success: true, data: mockRecentActivity });
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
