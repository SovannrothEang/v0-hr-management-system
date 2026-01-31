"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, UserX, Clock, CalendarOff, TrendingUp, BarChart3 } from "lucide-react";
import type { AttendanceReport } from "@/hooks/use-reports";

interface AttendanceReportCardProps {
  data?: AttendanceReport;
  isLoading: boolean;
}

export function AttendanceReportCard({ data, isLoading }: AttendanceReportCardProps) {
  if (isLoading || !data) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Attendance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Attendance Rate",
      value: `${data.attendanceRate ?? 0}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Present Days",
      value: data.presentDays ?? 0,
      icon: UserCheck,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Absent Days",
      value: data.absentDays ?? 0,
      icon: UserX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Late Days",
      value: data.lateDays ?? 0,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Leave Days",
      value: data.leaveDays ?? 0,
      icon: CalendarOff,
      color: "text-muted-foreground",
      bgColor: "bg-secondary",
    },
    {
      label: "Avg Work Hours",
      value: `${data.averageWorkHours ?? 0}h`,
      icon: BarChart3,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Clock className="h-5 w-5 text-primary" />
          Attendance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {data.totalOvertimeHours > 0 && (
          <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Total Overtime: <span className="font-semibold text-accent">{data.totalOvertimeHours}h</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
