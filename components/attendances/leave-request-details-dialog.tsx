"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/stores/attendance-store";
import { useUpdateLeaveRequest } from "@/hooks/use-attendance";

// Use local UI components correctly
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface LeaveRequestDetailsDialogProps {
  request: LeaveRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}

const statusConfig: Record<LeaveStatus, { label: string; className: string; icon: any }> = {
  pending: { label: "Pending", className: "bg-warning/20 text-warning", icon: AlertCircle },
  approved: { label: "Approved", className: "bg-success/20 text-success", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive", icon: XCircle },
};

const leaveTypeLabels: Record<LeaveType, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  personal: "Personal Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  unpaid: "Unpaid Leave",
};

export function LeaveRequestDetailsDialog({
  request,
  open,
  onOpenChange,
  canManage,
}: LeaveRequestDetailsDialogProps) {
  const { mutate: updateRequest, isPending } = useUpdateLeaveRequest();
  const [isEditing, setIsEditing] = useState(false);

  if (!request) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleUpdateStatus = (status: "approved" | "rejected") => {
    updateRequest({
      id: request.id,
      status,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setIsEditing(false);
      }
    });
  };

  const handleStatusChange = (value: string) => {
    updateRequest({
      id: request.id,
      status: value as "approved" | "rejected",
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const StatusIcon = statusConfig[request.status].icon;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setIsEditing(false);
    }}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl z-[100]">
        <DialogHeader className="p-8 bg-muted/30 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge className={cn("border-0 px-3 py-1 text-xs font-semibold uppercase tracking-wider", statusConfig[request.status].className)}>
                <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                {statusConfig[request.status].label}
              </Badge>
              {canManage && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="mr-1 h-3 w-3" />
                  Edit Status
                </Button>
              )}
            </div>

            <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border border-border">
              Ref: {request.id.slice(-8).toUpperCase()}
            </span>
          </div>

          {isEditing && canManage ? (
            <div className="space-y-3 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Change Request Status</p>
              <Select defaultValue={request.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full h-12 border-primary/30 bg-background text-lg font-medium">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
                onClick={() => setIsEditing(false)}
              >
                Cancel editing
              </Button>
            </div>
          ) : (
            <>
              <DialogTitle className="text-2xl font-bold tracking-tight">Leave Request Details</DialogTitle>
              <DialogDescription className="text-base">
                Detailed information about the employee's time-off request.
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Employee Section */}
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 border-4 border-background shadow-sm">
              <AvatarImage src={request.employeeAvatar} alt={request.employeeName} className="object-cover w-full" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(request.employeeName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-bold text-card-foreground text-xl leading-none">
                {request.employeeName}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>Employee ID: {request.employee?.employeeId || request.employeeId}</span>
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Details Section */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                <FileText className="h-3.5 w-3.5" />
                Leave Type
              </p>
              <p className="text-lg font-semibold">{leaveTypeLabels[request.type]}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                <Clock className="h-3.5 w-3.5" />
                Total Duration
              </p>
              <p className="text-lg font-semibold">{request.days} day{request.days !== 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-2 col-span-full">
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                <Calendar className="h-3.5 w-3.5" />
                Time Period
              </p>
              <div className="p-4 rounded-xl bg-secondary/20 border border-secondary/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDate(request.startDate)}</p>
                  </div>
                  <div className="h-px sm:h-8 w-full sm:w-px bg-border sm:mx-4" />
                  <div className="space-y-0.5 sm:text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDate(request.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
              <AlertCircle className="h-3.5 w-3.5" />
              Employee Reason
            </p>
            <div className="bg-muted/30 rounded-xl p-5 text-sm text-card-foreground leading-relaxed border border-border/50 italic shadow-inner">
              "{request.reason || "No reason provided."}"
            </div>
          </div>

          {/* Review Info */}
          {request.status !== "pending" && (
            <div className="p-4 rounded-xl bg-muted/40 border border-dashed border-border flex items-start gap-3">
              <div className={cn("p-2 rounded-full", statusConfig[request.status].className)}>
                <StatusIcon className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Review Summary</p>
                <p className="text-sm">
                  Processed by <span className="font-bold">{request.reviewedBy || "System Admin"}</span>
                  {request.reviewedAt && (
                    <> on <span className="font-bold">{formatDate(request.reviewedAt)}</span></>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 pt-0 flex-col sm:flex-row gap-3">
          {request.status === "pending" && canManage && !isEditing ? (
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 font-semibold"
                onClick={() => handleUpdateStatus("rejected")}
                disabled={isPending}
              >
                <XCircle className="mr-2 h-5 w-5" />
                Reject Request
              </Button>
              <Button
                className="flex-1 h-12 bg-success hover:bg-success/90 text-success-foreground font-semibold shadow-lg shadow-success/20"
                onClick={() => handleUpdateStatus("approved")}
                disabled={isPending}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Approve Request
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="w-full h-12 font-semibold"
              onClick={() => onOpenChange(false)}
            >
              {isEditing ? "Cancel" : "Close Details"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}