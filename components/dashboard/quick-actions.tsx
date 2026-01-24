"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Clock,
  FileText,
  Calculator,
  ArrowRight,
} from "lucide-react";

const actions = [
  {
    label: "Add Employee",
    href: "/employees?action=new",
    icon: UserPlus,
    description: "Register a new team member",
  },
  {
    label: "View Attendance",
    href: "/attendance",
    icon: Clock,
    description: "Check today's attendance",
  },
  {
    label: "Leave Requests",
    href: "/leave-requests",
    icon: FileText,
    description: "Manage pending requests",
  },
  {
    label: "Run Payroll",
    href: "/payroll",
    icon: Calculator,
    description: "Process monthly payroll",
  },
];

export function QuickActions() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-card-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-3 hover:bg-secondary/50"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-card-foreground">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
