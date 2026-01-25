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
import { cn } from "@/lib/utils";

interface DepartmentData {
  department: string;
  count: number;
  percentage?: number;
}

interface DepartmentDistributionChartProps {
  data: DepartmentData[];
  showLegend?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "card" | "inline";
  className?: string;
  title?: string;
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

const SIZE_CONFIG = {
  sm: {
    innerRadius: 50,
    outerRadius: 75,
    height: 250,
  },
  md: {
    innerRadius: 60,
    outerRadius: 90,
    height: 300,
  },
  lg: {
    innerRadius: 70,
    outerRadius: 110,
    height: 350,
  },
};

export function DepartmentDistributionChart({
  data,
  showLegend = true,
  size = "md",
  variant = "card",
  className,
  title = "Department Distribution",
}: DepartmentDistributionChartProps) {
  const { innerRadius, outerRadius, height } = SIZE_CONFIG[size];

  const chartContent = (
    <div className={cn("w-full", variant === "inline" && "h-full")} style={{ height: variant === "card" ? height : "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx={showLegend ? "32%" : "50%"}
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="count"
            nameKey="department"
          >
            {data.map((_, index) => (
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
            formatter={(value: number, name: string) => [
              `${value} employees`,
              name,
            ]}
          />
          {showLegend && (
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{
                // paddingLeft: "15px",
                // paddingRight: "10px",
                color: "var(--color-foreground)",
                lineHeight: "1.8",
              }}
              iconSize={10}
              iconType="circle"
              formatter={(value) => (
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--color-foreground)",
                    fontWeight: 500,
                  }}
                >
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  if (variant === "card") {
    return (
      <Card className={cn("bg-card border-border", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-card-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{chartContent}</CardContent>
      </Card>
    );
  }

  return chartContent;
}
