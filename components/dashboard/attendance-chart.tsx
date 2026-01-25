"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AttendanceTrend } from "@/hooks/use-dashboard";

interface AttendanceChartProps {
  data: AttendanceTrend[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-card-foreground">
          Attendance Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.2 25)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.55 0.2 25)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.2 45)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.2 45)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
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
              <Legend
                wrapperStyle={{ 
                  paddingTop: "20px",
                  color: "var(--color-foreground)"
                }}
                formatter={(value) => <span style={{ color: "var(--color-foreground)" }}>{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="present"
                name="Present"
                stroke="oklch(0.7 0.15 160)"
                strokeWidth={2}
                fill="url(#presentGradient)"
              />
              <Area
                type="monotone"
                dataKey="absent"
                name="Absent"
                stroke="oklch(0.55 0.2 25)"
                strokeWidth={2}
                fill="url(#absentGradient)"
              />
              <Area
                type="monotone"
                dataKey="late"
                name="Late"
                stroke="oklch(0.65 0.2 45)"
                strokeWidth={2}
                fill="url(#lateGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
