"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  User,
  AlertCircle,
  Pencil,
} from "lucide-react";
import type { Employee, EmploymentStatus } from "@/stores/employee-store";

interface EmployeeDetailSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (employee: Employee) => void;
}

const statusConfig: Record<
  EmploymentStatus,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-success/20 text-success" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground" },
  on_leave: { label: "On Leave", className: "bg-secondary text-secondary-foreground" },
  probation: { label: "Probation", className: "bg-warning/20 text-warning" },
  terminated: { label: "Terminated", className: "bg-destructive/20 text-destructive" },
};

const employmentTypeLabels = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  intern: "Intern",
};

export function EmployeeDetailSheet({
  employee,
  open,
  onOpenChange,
  onEdit,
}: EmployeeDetailSheetProps) {
  if (!employee) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.firstName} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(employee.firstName, employee.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">
                  {employee.firstName} {employee.lastName}
                </SheetTitle>
                <SheetDescription className="text-sm">
                  {employee.position}
                </SheetDescription>
                <Badge className={cn("mt-2", statusConfig[employee.status].className)}>
                  {statusConfig[employee.status].label}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onEdit(employee)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Employee
          </Button>
        </SheetHeader>

        <Separator />

        <div className="space-y-6 py-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{employee.phone}</span>
              </div>
              {employee.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{employee.address}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Employment Details */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Employment Details
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Employee ID</span>
                </div>
                <span className="text-sm font-mono">{employee.employeeId}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Department</span>
                </div>
                <span className="text-sm">{employee.department}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Employment Type</span>
                </div>
                <span className="text-sm">
                  {employmentTypeLabels[employee.employmentType]}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Hire Date</span>
                </div>
                <span className="text-sm">
                  {new Date(employee.hireDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Annual Salary</span>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(employee.salary)}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {employee.emergencyContact && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Emergency Contact
                </h3>
                <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">
                      {employee.emergencyContact.name}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {employee.emergencyContact.relationship}
                  </p>
                  <p className="text-sm">{employee.emergencyContact.phone}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
