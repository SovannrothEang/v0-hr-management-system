"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Clock, CheckCircle2 } from "lucide-react";
import type { PayrollSummary } from "@/types";

interface PayrollSummaryCardsProps {
  summary?: PayrollSummary;
}

export function PayrollSummaryCards({ summary }: PayrollSummaryCardsProps) {

  const totalEmployees = summary?.byDepartment?.reduce((sum, dept) => sum + dept.employeeCount, 0) ?? 0;
  const processedCount = summary?.byStatus?.find(s => s.status === "PROCESSED")?.count ?? 0;
  const paidCount = summary?.byStatus?.find(s => s.status === "PAID")?.count ?? 0;

  const cards = [
    {
      title: "Total Net Salary",
      value: `$${(summary?.totalNetSalary ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
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
      title: "Processed",
      value: processedCount,
      icon: Clock,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      title: "Paid",
      value: paidCount,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
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
