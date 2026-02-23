"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, UserCheck, UserX } from "lucide-react";

interface UserSummaryCardsProps {
  totalUsers: number;
  adminCount: number;
  hrCount: number;
  activeCount: number;
}

export function UserSummaryCards({
  totalUsers,
  adminCount,
  hrCount,
  activeCount,
}: UserSummaryCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Admins",
      value: adminCount,
      icon: Shield,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "HR Managers",
      value: hrCount,
      icon: UserCheck,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      title: "Active Users",
      value: activeCount,
      icon: UserX,
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
