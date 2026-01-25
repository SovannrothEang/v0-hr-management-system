import { NextResponse } from "next/server";
import { departments } from "@/lib/mock-data";
import { withAuth } from "@/lib/auth/with-auth";

export const GET = withAuth(async () => {
  return NextResponse.json({ success: true, data: departments });
});
