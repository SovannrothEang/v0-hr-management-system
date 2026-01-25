"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/stores/attendance-store";

interface LeaveRequestTableProps {
  requests: LeaveRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  showActions?: boolean;
}

const statusConfig: Record<LeaveStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/20 text-warning" },
  approved: { label: "Approved", className: "bg-success/20 text-success" },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive" },
};

const leaveTypeLabels: Record<LeaveType, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  personal: "Personal Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  unpaid: "Unpaid Leave",
};

export function LeaveRequestTable({
  requests,
  onApprove,
  onReject,
  showActions = true,
}: LeaveRequestTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30 hover:bg-secondary/30">
            <TableHead>Employee</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 7 : 6}
                className="h-32 text-center text-muted-foreground"
              >
                No leave requests found.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <p className="font-medium text-card-foreground">
                    {request.employeeName}
                  </p>
                </TableCell>
                <TableCell>{leaveTypeLabels[request.type]}</TableCell>
                <TableCell className="text-sm">
                  <div>
                    <span>{formatDate(request.startDate)}</span>
                    {request.startDate !== request.endDate && (
                      <>
                        <span className="text-muted-foreground"> - </span>
                        <span>{formatDate(request.endDate)}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>{request.days} day{request.days !== 1 ? "s" : ""}</TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="truncate text-muted-foreground">{request.reason}</p>
                </TableCell>
                <TableCell>
                  <Badge className={cn("border-0", statusConfig[request.status].className)}>
                    {statusConfig[request.status].label}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    {request.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success hover:text-success border-success/30 hover:bg-success/10"
                          onClick={() => onApprove(request.id)}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => onReject(request.id)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status !== "pending" && request.approvedBy && (
                      <span className="text-xs text-muted-foreground">
                        by {request.approvedBy}
                      </span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
