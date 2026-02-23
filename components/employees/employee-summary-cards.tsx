"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

interface EmployeeSummaryCardsProps {
  totalEmployees: number;
  activeCount: number;
  inactiveCount: number;
  newThisMonth: number;
}

export function EmployeeSummaryCards({
  totalEmployees,
  activeCount,
  inactiveCount,
  newThisMonth,
}: EmployeeSummaryCardsProps) {
  const cards = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Active",
      value: activeCount,
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Inactive",
      value: inactiveCount,
      icon: UserX,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "New This Month",
      value: newThisMonth,
      icon: Clock,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
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
                <p className="text-2xl font-bold text-foreground mt-1">
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
