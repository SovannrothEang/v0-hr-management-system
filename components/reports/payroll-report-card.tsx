"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import type { PayrollReport } from "@/hooks/use-reports";

interface PayrollReportCardProps {
  data?: PayrollReport;
  isLoading: boolean;
}

export function PayrollReportCard({ data, isLoading }: PayrollReportCardProps) {
  if (isLoading || !data) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payroll Analytics
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
      label: "Total Payroll",
      value: `$${data.totalPayroll.toLocaleString()}`,
      icon: DollarSign,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Average Salary",
      value: `$${data.averageSalary.toLocaleString()}`,
      icon: Calculator,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "Total Allowances",
      value: `$${data.totalAllowances.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Total Deductions",
      value: `$${data.totalDeductions.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <DollarSign className="h-5 w-5 text-primary" />
          Payroll Analytics
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
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Payroll Trend
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.payrollTrend}>
                  <defs>
                    <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="oklch(0.7 0.15 160)"
                    strokeWidth={2}
                    fill="url(#payrollGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Department Payroll
            </h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentPayroll.slice(0, 6)} layout="vertical">
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
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="department"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    width={100}
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Total"]}
                  />
                  <Bar dataKey="total" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
