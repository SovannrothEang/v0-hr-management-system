import { NextResponse } from "next/server";
import { departments } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ success: true, data: departments });
}
