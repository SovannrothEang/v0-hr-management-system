"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  onViewDetails: (request: LeaveRequest) => void;
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
  onViewDetails,
  showActions = true,
}: LeaveRequestTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
            <TableHead>Created Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 8 : 7}
                className="h-32 text-center text-muted-foreground"
              >
                No leave requests found.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow
                key={request.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onViewDetails(request)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ">
                      <AvatarImage src={request.employeeAvatar} alt={request.employeeName} className="object-cover w-full" />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {getInitials(request.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-card-foreground">
                      {request.employeeName}
                    </p>
                  </div>
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
                <TableCell className="text-sm">
                  {request.createdAt ? formatDate(request.createdAt) : "-"}
                </TableCell>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(request.id);
                          }}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReject(request.id);
                          }}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status !== "pending" && (request.reviewedBy || request.approvedBy) && (
                      <span className="text-xs text-muted-foreground">
                        by {request.reviewedBy || request.approvedBy}
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
