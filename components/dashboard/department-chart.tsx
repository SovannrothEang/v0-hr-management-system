"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { DepartmentDistribution } from "@/hooks/use-dashboard";

interface DepartmentChartProps {
  data: DepartmentDistribution[];
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

export function DepartmentChart({ data }: DepartmentChartProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-card-foreground">
          Department Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                nameKey="department"
              >
                {data.map((_, index) => (
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
                formatter={(value: number, name: string) => [
                  `${value} employees`,
                  name,
                ]}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ paddingLeft: "20px" }}
                formatter={(value) => (
                  <span style={{ color: "oklch(0.6 0 0)", fontSize: "12px" }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
