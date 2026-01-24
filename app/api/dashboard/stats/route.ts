import { NextResponse } from "next/server";
import { mockDashboardStats } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ success: true, data: mockDashboardStats });
}
