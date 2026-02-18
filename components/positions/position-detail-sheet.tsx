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
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Calendar,
  Users,
  Pencil,
  FileText,
  Award,
} from "lucide-react";
import type { Position } from "@/hooks/use-positions";

interface PositionDetailSheetProps {
  position: Position | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (position: Position) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PositionDetailSheet({
  position,
  open,
  onOpenChange,
  onEdit,
}: PositionDetailSheetProps) {
  if (!position) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl">{position.title}</SheetTitle>
              <SheetDescription className="text-sm mt-1">
                {position.description || "No description provided"}
              </SheetDescription>
              <div className="mt-2">
                <Badge
                  variant={position.isActive ? "default" : "outline"}
                  className={cn(
                    position.isActive && "bg-success/20 text-success border-0"
                  )}
                >
                  {position.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onEdit(position)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Position
          </Button>
        </SheetHeader>

        <Separator />

        <div className="space-y-6 py-6">
          {/* Salary Information */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Salary Range
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Minimum</span>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(position.salaryRangeMin)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Maximum</span>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(position.salaryRangeMax)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Position Details */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Position Details
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Employees</span>
                </div>
                <Badge variant="secondary">{position.employeeCount}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Position ID</span>
                </div>
                <span className="text-sm font-mono">{position.id.slice(0, 8)}</span>
              </div>
              {position.createdAt && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Created</span>
                  </div>
                  <span className="text-sm">
                    {new Date(position.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {position.updatedAt && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                  </div>
                  <span className="text-sm">
                    {new Date(position.updatedAt).toLocaleDateString("en-US", {
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
