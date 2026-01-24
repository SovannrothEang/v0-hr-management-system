import { NextResponse } from "next/server";
import { mockRecentActivity } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ success: true, data: mockRecentActivity });
}
