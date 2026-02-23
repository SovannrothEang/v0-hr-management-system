"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, DollarSign, Calendar } from "lucide-react";
import type { AttendanceReport, EmployeeReport, PayrollReport, LeaveReport } from "@/hooks/use-reports";

interface ReportsSummaryCardsProps {
  attendanceData?: AttendanceReport;
  employeeData?: EmployeeReport;
  payrollData?: PayrollReport;
  leaveData?: LeaveReport;
  isLoading: boolean;
}

export function ReportsSummaryCards({
  attendanceData,
  employeeData,
  payrollData,
  leaveData,
  isLoading,
}: ReportsSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Employees",
      value: employeeData?.totalEmployees ?? 0,
      subValue: `${employeeData?.activeEmployees ?? 0} active`,
      icon: Users,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Attendance Rate",
      value: `${attendanceData?.attendanceRate ?? 0}%`,
      subValue: `${attendanceData?.presentDays ?? 0} present days`,
      icon: Clock,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Total Payroll",
      value: `$${(payrollData?.totalPayroll ?? 0).toLocaleString()}`,
      subValue: `Avg: $${(payrollData?.averageSalary ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      title: "Leave Requests",
      value: leaveData?.totalRequests ?? 0,
      subValue: `${leaveData?.pendingRequests ?? 0} pending`,
      icon: Calendar,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{card.subValue}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
