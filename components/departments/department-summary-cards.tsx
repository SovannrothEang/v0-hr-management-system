"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, UserPlus, TrendingUp } from "lucide-react";

interface DepartmentSummaryCardsProps {
  totalDepartments: number;
  totalEmployees: number;
  avgEmployeesPerDept: number;
  largestDept: string;
}

export function DepartmentSummaryCards({
  totalDepartments,
  totalEmployees,
  avgEmployeesPerDept,
  largestDept,
}: DepartmentSummaryCardsProps) {
  const cards = [
    {
      title: "Total Departments",
      value: totalDepartments,
      icon: Building2,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Avg per Dept",
      value: avgEmployeesPerDept.toFixed(1),
      icon: TrendingUp,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      title: "Largest Dept",
      value: largestDept || "—",
      icon: UserPlus,
      color: "text-success",
      bgColor: "bg-success/10",
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold text-foreground mt-1 ${card.isText ? 'text-lg truncate max-w-[120px]' : ''}`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
