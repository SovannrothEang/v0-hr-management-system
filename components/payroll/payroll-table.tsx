"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProcessPayroll, useMarkPayrollPaid } from "@/hooks/use-payroll";
import { usePayrollStore } from "@/stores/payroll-store";
import { usePermissions } from "@/hooks/use-permissions";
import { MoreHorizontal, FileText, CheckCircle2, Clock, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { PayrollRecord } from "@/types";

interface PayrollTableProps {
  records: PayrollRecord[];
  isLoading?: boolean;
  onViewPayslip: (payrollId: string) => void;
  onProcess?: (payrollId: string) => void;
  onMarkPaid?: (payrollId: string) => void;
  showActions?: boolean;
}

export function PayrollTable({ 
  records, 
  isLoading, 
  onViewPayslip,
  onProcess,
  onMarkPaid,
  showActions = true 
}: PayrollTableProps) {
  const processPayroll = useProcessPayroll();
  const markPaid = useMarkPayrollPaid();
  const { selectedPayrolls, togglePayroll, selectAll, clearSelection } = usePayrollStore();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { isAdmin, isEmployee } = usePermissions();

  const handleProcess = async (payrollId: string) => {
    if (onProcess) {
      onProcess(payrollId);
      return;
    }
    setProcessingIds((prev) => new Set(prev).add(payrollId));
    try {
      await processPayroll.mutateAsync(payrollId);
      toast.success("Payroll processed successfully");
    } catch {
      toast.error("Failed to process payroll");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(payrollId);
        return next;
      });
    }
  };

  const handleMarkPaid = async (payrollId: string) => {
    if (onMarkPaid) {
      onMarkPaid(payrollId);
      return;
    }
    setProcessingIds((prev) => new Set(prev).add(payrollId));
    try {
      await markPaid.mutateAsync(payrollId);
      toast.success("Payroll marked as paid");
    } catch {
      toast.error("Failed to mark payroll as paid");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(payrollId);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "processed":
        return (
          <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">
            <Clock className="h-3 w-3 mr-1" />
            Processed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-border">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const allSelected = records?.length ? selectedPayrolls.length === records.length : false;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAll(records?.map((p) => p.id) ?? []);
                  } else {
                    clearSelection();
                  }
                }}
              />
            </TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Basic Salary</TableHead>
            <TableHead>Allowances</TableHead>
            <TableHead>Deductions</TableHead>
            <TableHead>Net Pay</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records && records.length > 0 ? (
            records.map((payroll) => (
              <TableRow key={payroll.id} className="hover:bg-secondary/30">
                <TableCell>
                  <Checkbox
                    checked={selectedPayrolls.includes(payroll.id)}
                    onCheckedChange={() => togglePayroll(payroll.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={payroll.employee?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {payroll.employee?.firstName?.[0] || 'U'}
                        {payroll.employee?.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {payroll.employee?.firstName} {payroll.employee?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payroll.employee?.department}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
                  {payroll.period}
                </TableCell>
                <TableCell className="text-foreground">
                  ${payroll.basicSalary.toLocaleString()}
                </TableCell>
                <TableCell className="text-success">
                  +${payroll.allowances.toLocaleString()}
                </TableCell>
                <TableCell className="text-destructive">
                  -${payroll.deductions.toLocaleString()}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  ${payroll.netPay.toLocaleString()}
                </TableCell>
                <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                <TableCell>
                  {showActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewPayslip(payroll.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Payslip
                        </DropdownMenuItem>
                        {!isEmployee && payroll.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() => handleProcess(payroll.id)}
                            disabled={processingIds.has(payroll.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Process Payroll
                          </DropdownMenuItem>
                        )}
                        {isAdmin && payroll.status === "processed" && (
                          <DropdownMenuItem
                            onClick={() => handleMarkPaid(payroll.id)}
                            disabled={processingIds.has(payroll.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                No payroll records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
