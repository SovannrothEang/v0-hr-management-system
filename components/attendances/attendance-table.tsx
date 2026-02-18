"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import type { AttendanceRecord, AttendanceStatus } from "@/stores/attendance-store";
import type { Employee } from "@/stores/employee-store";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  employees: Employee[];
  onClockIn: (employeeId: string) => void;
  onClockOut: (employeeId: string) => void;
}

const statusConfig: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  present: { label: "Present", className: "bg-success/20 text-success" },
  late: { label: "Late", className: "bg-warning/20 text-warning" },
  absent: { label: "Absent", className: "bg-destructive/20 text-destructive" },
  half_day: { label: "Half Day", className: "bg-accent/20 text-accent" },
  on_leave: { label: "On Leave", className: "bg-secondary text-secondary-foreground" },
  excused: { label: "Excused", className: "bg-info/20 text-info" },
  early_out: { label: "Early Out", className: "bg-warning/20 text-warning" },
  overtime: { label: "Overtime", className: "bg-success/20 text-success" },
  did_not_checkout: { label: "Missing Checkout", className: "bg-destructive/20 text-destructive" },
};

export function AttendanceTable({
  records,
  employees,
  onClockIn,
  onClockOut,
}: AttendanceTableProps) {
  const getEmployee = (employeeId: string) =>
    employees.find((e) => e.id === employeeId);

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName[0]}${lastName[0]}`.toUpperCase();

  const formatTime = (time?: string) => {
    if (!time) return "-";
    return time;
  };

  const formatWorkHours = (hours?: number | string) => {
    if (!hours) return "-";
    const num = typeof hours === 'string' ? parseFloat(hours) : hours;
    if (isNaN(num)) return "-";
    return `${num.toFixed(1)}h`;
  };

  const formatOvertime = (overtime?: number | string) => {
    if (!overtime) return null;
    const num = typeof overtime === 'string' ? parseFloat(overtime) : overtime;
    if (isNaN(num) || num === 0) return null;
    return `+${num.toFixed(1)}h`;
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30 hover:bg-secondary/30">
            <TableHead>Employee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Clock In</TableHead>
            <TableHead>Clock Out</TableHead>
            <TableHead>Work Hours</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-32 text-center text-muted-foreground"
              >
                No attendance records for this date.
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => {
              const employee = getEmployee(record.employeeId) || record.employee;

              const firstName = employee?.firstName || "Unknown";
              const lastName = employee?.lastName || "";
              const department = (employee as any)?.department || "N/A";
              const avatar = (employee as any)?.avatar;

              const canClockIn = !record.clockIn && record.status !== "on_leave";
              const canClockOut =
                record.clockIn && !record.clockOut && record.status !== "on_leave";

              return (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={avatar || "/placeholder.svg"} alt={firstName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(firstName, lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {firstName} {lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {typeof department === 'string' ? department : (department as any)?.name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-0", statusConfig[record.status].className)}>
                      {statusConfig[record.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatTime(record.clockIn)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatTime(record.clockOut)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatWorkHours(record.workHours)}
                  </TableCell>
                  <TableCell>
                    {formatOvertime(record.overtime) ? (
                      <span className="text-success font-medium">
                        {formatOvertime(record.overtime)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canClockIn && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onClockIn(record.employeeId)}
                        >
                          <LogIn className="mr-1 h-4 w-4" />
                          Clock In
                        </Button>
                      )}
                      {canClockOut && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onClockOut(record.employeeId)}
                        >
                          <LogOut className="mr-1 h-4 w-4" />
                          Clock Out
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
