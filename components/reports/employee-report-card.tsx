"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentDistributionChart } from "@/components/charts/department-distribution-chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, UserCheck, CalendarOff, UserPlus } from "lucide-react";
import type { EmployeeReport } from "@/hooks/use-reports";
import { ExportDropdown } from "./export-dropdown";

interface EmployeeReportCardProps {
  data?: EmployeeReport;
  isLoading: boolean;
  exportParams?: Record<string, string>;
}

export function EmployeeReportCard({ data, isLoading, exportParams }: EmployeeReportCardProps) {
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
      value: data.totalEmployees ?? 0,
      icon: Users,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Active",
      value: data.activeEmployees ?? 0,
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "On Leave",
      value: data.onLeaveEmployees ?? 0,
      icon: CalendarOff,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "New Hires (30d)",
      value: data.newHires ?? 0,
      icon: UserPlus,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5 text-primary" />
          Employee Statistics
        </CardTitle>
        <ExportDropdown
          endpoint="/reports/employees/export"
          params={exportParams}
          reportName="employee_report"
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

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Department Distribution
            </h4>
            <div className="h-[250px]">
              <DepartmentDistributionChart
                data={data.departmentBreakdown}
                variant="inline"
                size="sm"
                showLegend={true}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Top Positions
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data.positionBreakdown || []).slice(0, 5)} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="position"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    width={120}
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
                  <Bar dataKey="count" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
