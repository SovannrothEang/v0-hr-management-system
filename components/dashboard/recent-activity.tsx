"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, DollarSign, UserPlus, CalendarDays } from "lucide-react";
import type { RecentActivity } from "@/hooks/use-dashboard";

interface RecentActivityListProps {
  activities: RecentActivity[];
}

const activityIcons = {
  attendance: Clock,
  leave: CalendarDays,
  payroll: DollarSign,
  employee: UserPlus,
};

const activityColors = {
  attendance: "text-primary bg-primary/10",
  leave: "text-primary bg-accent/10",
  payroll: "text-success bg-success/10",
  employee: "text-chart-3 bg-chart-3/10",
};

export function RecentActivityList({ activities }: RecentActivityListProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-card-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    colorClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-card-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
