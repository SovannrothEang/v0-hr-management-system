"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UserCheck, UserX, Clock, CalendarOff } from "lucide-react";
import type { AttendanceRecord, AttendanceSummary } from "@/stores/attendance-store";

interface AttendanceOverviewProps {
  records?: AttendanceRecord[];
  summary?: AttendanceSummary;
}

export function AttendanceOverview({ records = [], summary }: AttendanceOverviewProps) {
  const getStatusCount = (status: string) => {
    return records.filter((r) => r.status.toLowerCase() === status.toLowerCase()).length;
  };

  const present = summary?.daysPresent ?? (getStatusCount("present") + getStatusCount("late") + getStatusCount("early_out"));
  const late = summary?.lateCount ?? getStatusCount("late");
  const absent = summary?.daysAbsent ?? getStatusCount("absent");
  const onLeave = summary?.daysOnLeave ?? getStatusCount("on_leave");
  const total = records.length;

  const stats = [
    {
      label: "Present",
      value: present,
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Late",
      value: late,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Absent",
      value: absent,
      icon: UserX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "On Leave",
      value: onLeave,
      icon: CalendarOff,
      color: "text-muted-foreground",
      bgColor: "bg-secondary",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border py-2">
          <CardContent className="p-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  stat.bgColor
                )}
              >
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-card-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
