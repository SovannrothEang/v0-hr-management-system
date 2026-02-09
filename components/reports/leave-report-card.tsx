"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { LeaveReport } from "@/hooks/use-reports";
import { ExportDropdown } from "./export-dropdown";

interface LeaveReportCardProps {
  data?: LeaveReport;
  isLoading: boolean;
  exportParams?: Record<string, string>;
}

const COLORS = [
  "oklch(0.7 0.15 160)",
  "oklch(0.65 0.2 45)",
  "oklch(0.6 0.15 250)",
  "oklch(0.7 0.18 320)",
  "oklch(0.55 0.2 25)",
];

export function LeaveReportCard({ data, isLoading, exportParams }: LeaveReportCardProps) {
  if (isLoading || !data) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Leave Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Total Requests",
      value: data.totalRequests ?? 0,
      icon: Calendar,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Approved",
      value: data.approvedRequests ?? 0,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Rejected",
      value: data.rejectedRequests ?? 0,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Pending",
      value: data.pendingRequests ?? 0,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Leave Analytics
        </CardTitle>
        <ExportDropdown
          endpoint="/reports/leaves/export"
          params={exportParams}
          reportName="leave_report"
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Average Leave Duration:{" "}
            <span className="font-semibold text-accent">{data.averageLeaveDays ?? 0} days</span>
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Leave Type Distribution
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.leaveTypeBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="type"
                  >
                    {(data.leaveTypeBreakdown || []).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="var(--color-background)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-popover-foreground)",
                    }}
                    itemStyle={{
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Monthly Trend
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyTrend || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-popover-foreground)",
                    }}
                    itemStyle={{
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-chart-1)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
