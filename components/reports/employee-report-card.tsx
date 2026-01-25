"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Users, UserCheck, CalendarOff, UserPlus } from "lucide-react";
import type { EmployeeReport } from "@/hooks/use-reports";

interface EmployeeReportCardProps {
  data?: EmployeeReport;
  isLoading: boolean;
}

const COLORS = [
  "oklch(0.7 0.15 160)",
  "oklch(0.65 0.2 45)",
  "oklch(0.6 0.15 250)",
  "oklch(0.7 0.18 320)",
  "oklch(0.55 0.2 25)",
  "oklch(0.75 0.15 75)",
  "oklch(0.6 0.12 200)",
  "oklch(0.65 0.15 280)",
];

export function EmployeeReportCard({ data, isLoading }: EmployeeReportCardProps) {
  if (isLoading || !data) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Employee Statistics
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
      label: "Total Employees",
      value: data.totalEmployees,
      icon: Users,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Active",
      value: data.activeEmployees,
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "On Leave",
      value: data.onLeaveEmployees,
      icon: CalendarOff,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "New Hires (30d)",
      value: data.newHires,
      icon: UserPlus,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5 text-primary" />
          Employee Statistics
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

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Department Distribution
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.departmentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="department"
                  >
                    {data.departmentBreakdown.map((_, index) => (
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
              Top Positions
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.positionBreakdown.slice(0, 5)} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.25 0.005 285)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "oklch(0.25 0.005 285)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="position"
                    tick={{ fill: "oklch(0.6 0 0)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "oklch(0.25 0.005 285)" }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.13 0.005 285)",
                      border: "1px solid oklch(0.25 0.005 285)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0 0)",
                    }}
                  />
                  <Bar dataKey="count" fill="oklch(0.7 0.15 160)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
