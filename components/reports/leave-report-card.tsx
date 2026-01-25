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

interface LeaveReportCardProps {
  data?: LeaveReport;
  isLoading: boolean;
}

const COLORS = [
  "oklch(0.7 0.15 160)",
  "oklch(0.65 0.2 45)",
  "oklch(0.6 0.15 250)",
  "oklch(0.7 0.18 320)",
  "oklch(0.55 0.2 25)",
];

export function LeaveReportCard({ data, isLoading }: LeaveReportCardProps) {
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
      value: data.totalRequests,
      icon: Calendar,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Approved",
      value: data.approvedRequests,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Rejected",
      value: data.rejectedRequests,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Pending",
      value: data.pendingRequests,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Leave Analytics
        </CardTitle>
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
            <span className="font-semibold text-accent">{data.averageLeaveDays} days</span>
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
                    data={data.leaveTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="type"
                  >
                    {data.leaveTypeBreakdown.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="oklch(0.13 0.005 285)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.13 0.005 285)",
                      border: "1px solid oklch(0.25 0.005 285)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0 0)",
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
                <LineChart data={data.monthlyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.25 0.005 285)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "oklch(0.25 0.005 285)" }}
                  />
                  <YAxis
                    tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "oklch(0.25 0.005 285)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.13 0.005 285)",
                      border: "1px solid oklch(0.25 0.005 285)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0 0)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="oklch(0.7 0.15 160)"
                    strokeWidth={2}
                    dot={{ fill: "oklch(0.7 0.15 160)", r: 4 }}
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
