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
import { usePayroll, useProcessPayroll, useMarkPayrollPaid } from "@/hooks/use-payroll";
import { usePayrollStore } from "@/stores/payroll-store";
import { MoreHorizontal, FileText, CheckCircle2, Clock, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface PayrollTableProps {
  month: string;
  year: number;
  onViewPayslip: (payrollId: string) => void;
}

export function PayrollTable({ month, year, onViewPayslip }: PayrollTableProps) {
  const { data: payrolls, isLoading } = usePayroll(month, year);
  const processPayroll = useProcessPayroll();
  const markPaid = useMarkPayrollPaid();
  const { selectedPayrolls, togglePayroll, selectAll, clearSelection } = usePayrollStore();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleProcess = async (payrollId: string) => {
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

  const allSelected = payrolls?.length > 0 && selectedPayrolls.length === payrolls.length;

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
                    selectAll(payrolls?.map((p: { id: string }) => p.id) ?? []);
                  } else {
                    clearSelection();
                  }
                }}
              />
            </TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Basic Salary</TableHead>
            <TableHead>Allowances</TableHead>
            <TableHead>Deductions</TableHead>
            <TableHead>Net Pay</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrolls?.map((payroll: {
            id: string;
            employee: {
              id: string;
              firstName: string;
              lastName: string;
              avatar?: string;
              department: string;
            };
            basicSalary: number;
            allowances: number;
            deductions: number;
            netPay: number;
            status: string;
          }) => (
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
                    <AvatarImage src={payroll.employee.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {payroll.employee.firstName[0]}
                      {payroll.employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {payroll.employee.firstName} {payroll.employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payroll.employee.department}
                    </p>
                  </div>
                </div>
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
                    {payroll.status === "pending" && (
                      <DropdownMenuItem
                        onClick={() => handleProcess(payroll.id)}
                        disabled={processingIds.has(payroll.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Process Payroll
                      </DropdownMenuItem>
                    )}
                    {payroll.status === "processed" && (
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
