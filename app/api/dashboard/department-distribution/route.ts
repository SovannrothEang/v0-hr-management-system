import { NextResponse } from "next/server";
import { mockDepartmentDistribution } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ success: true, data: mockDepartmentDistribution });
}
