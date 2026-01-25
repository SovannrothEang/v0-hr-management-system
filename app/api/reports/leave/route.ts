import { NextResponse } from "next/server";
import { mockLeaveRequests } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const department = searchParams.get("department");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { success: false, message: "Start date and end date are required" },
      { status: 400 }
    );
  }

  let filteredRequests = mockLeaveRequests.filter(
    (req) => req.startDate >= startDate && req.startDate <= endDate
  );

  if (department && department !== "all") {
    filteredRequests = filteredRequests;
  }

  const totalRequests = filteredRequests.length;
  const approvedRequests = filteredRequests.filter(
    (r) => r.status === "approved"
  ).length;
  const rejectedRequests = filteredRequests.filter(
    (r) => r.status === "rejected"
  ).length;
  const pendingRequests = filteredRequests.filter(
    (r) => r.status === "pending"
  ).length;

  const totalDays = filteredRequests.reduce((acc, r) => acc + r.days, 0);
  const averageLeaveDays = filteredRequests.length
    ? totalDays / filteredRequests.length
    : 0;

  const typeMap = new Map<string, number>();
  filteredRequests.forEach((req) => {
    typeMap.set(req.type, (typeMap.get(req.type) || 0) + 1);
  });
  const leaveTypeBreakdown = Array.from(typeMap.entries()).map(
    ([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
      count,
    })
  );

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyTrend = months.slice(0, 6).map((month, idx) => ({
    month,
    count: Math.floor(Math.random() * 10) + 2,
  }));

  const report = {
    totalRequests,
    approvedRequests,
    rejectedRequests,
    pendingRequests,
    averageLeaveDays: Math.round(averageLeaveDays * 10) / 10,
    leaveTypeBreakdown,
    monthlyTrend,
  };

  return NextResponse.json({ success: true, data: report });
}
