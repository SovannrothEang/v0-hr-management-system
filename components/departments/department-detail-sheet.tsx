"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Calendar,
  Users,
  Pencil,
  Building2,
  Percent,
} from "lucide-react";
import type { Department } from "@/hooks/use-departments";

interface DepartmentDetailSheetProps {
  department: Department | null;
  totalEmployees: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (department: Department) => void;
}

export function DepartmentDetailSheet({
  department,
  totalEmployees,
  open,
  onOpenChange,
  onEdit,
}: DepartmentDetailSheetProps) {
  const { isAdmin } = usePermissions();

  if (!department) return null;

  const percentage = totalEmployees > 0 && department.employeeCount
    ? ((department.employeeCount / totalEmployees) * 100).toFixed(1)
    : "0";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl">{department.name}</SheetTitle>
              <SheetDescription className="text-sm mt-1">
                Department details and employee count
              </SheetDescription>
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onEdit(department)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Department
            </Button>
          )}
        </SheetHeader>

        <Separator />

        <div className="space-y-6 py-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Department Statistics
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Employees</span>
                </div>
                <Badge variant="secondary">{department.employeeCount || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">% of Workforce</span>
                </div>
                <span className="text-sm font-medium">{percentage}%</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Details
            </h3>
            <div className="grid gap-3">
              {department.createdAt && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Created</span>
                  </div>
                  <span className="text-sm">
                    {new Date(department.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {department.updatedAt && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                  </div>
                  <span className="text-sm">
                    {new Date(department.updatedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
