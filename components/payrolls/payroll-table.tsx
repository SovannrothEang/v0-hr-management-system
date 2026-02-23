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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useFinalizePayroll,
  useMarkPayrollPaid,
  useDeletePayroll,
  useDownloadPayslip,
} from "@/hooks/use-payroll";
import { usePayrollStore } from "@/stores/payroll-store";
import { usePermissions } from "@/hooks/use-permissions";
import {
  MoreHorizontal,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
  Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  showActions = true,
}: PayrollTableProps) {
  const finalizePayroll = useFinalizePayroll();
  const markPaid = useMarkPayrollPaid();
  const deletePayroll = useDeletePayroll();
  const downloadPayslip = useDownloadPayslip();
  const { selectedPayrolls, togglePayroll, selectAll, clearSelection } =
    usePayrollStore();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<PayrollRecord | null>(
    null
  );
  const { isAdmin, isHRManager, isEmployee } = usePermissions();
  const isManager = isAdmin || isHRManager;

  const handleFinalize = async (payrollId: string) => {
    if (onProcess) {
      onProcess(payrollId);
      return;
    }
    setProcessingIds((prev) => new Set(prev).add(payrollId));
    try {
      await finalizePayroll.mutateAsync(payrollId);
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
      await markPaid.mutateAsync({ payrollId });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(payrollId);
        return next;
      });
    }
  };

  const handleDeleteClick = (payroll: PayrollRecord) => {
    setPayrollToDelete(payroll);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (payrollToDelete) {
      setProcessingIds((prev) => new Set(prev).add(payrollToDelete.id));
      try {
        await deletePayroll.mutateAsync(payrollToDelete.id);
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(payrollToDelete.id);
          return next;
        });
        setPayrollToDelete(null);
      }
    }
    setDeleteDialogOpen(false);
  };

  const handleDownloadPayslip = async (payrollId: string) => {
    await downloadPayslip.mutateAsync(payrollId);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    if (!first && !last) return "??";
    return `${first}${last}`.toUpperCase();
  };

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
    <>
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
              <TableHead className="text-right">Basic</TableHead>
              <TableHead className="text-right">Overtime</TableHead>
              <TableHead className="text-right">Bonus</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records && records.length > 0 ? (
              records.map((payroll) => (
                <TableRow
                  key={payroll.id}
                  className="hover:bg-secondary/30 cursor-pointer"
                  onClick={() => onViewPayslip(payroll.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedPayrolls.includes(payroll.id)}
                      onCheckedChange={() => togglePayroll(payroll.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={payroll.employee?.avatar}
                          alt={`${payroll.employee?.firstName || ""} ${payroll.employee?.lastName || ""}`}
                          className="object-cover w-full"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(payroll.employee?.firstName, payroll.employee?.lastName)}
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
                  <TableCell className="text-right text-foreground">
                    ${(payroll.basicSalary ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-chart-2">
                    {payroll.overtimeHrs > 0
                      ? `$${payroll.overtimePay.toLocaleString()} (${payroll.overtimeHrs}h)`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right text-success">
                    {payroll.bonus > 0
                      ? `+$${payroll.bonus.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {payroll.deductions > 0
                      ? `-$${payroll.deductions.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right text-orange-500">
                    {payroll.taxCalculation?.taxAmount
                      ? `-$${payroll.taxCalculation.taxAmount.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    $
                    {(payroll.netSalary ?? payroll.netPay ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payroll.currencyCode || "USD"}
                  </TableCell>
                  <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {showActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => onViewPayslip(payroll.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Payslip
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownloadPayslip(payroll.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          {isManager &&
                            payroll.status?.toLowerCase() === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleFinalize(payroll.id)}
                                  disabled={processingIds.has(payroll.id)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Finalize Payroll
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(payroll)}
                                  disabled={processingIds.has(payroll.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          {isAdmin &&
                            payroll.status?.toLowerCase() === "processed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleMarkPaid(payroll.id)}
                                  disabled={processingIds.has(payroll.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              </>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="h-32 text-center text-muted-foreground"
                >
                  No payroll records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payroll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payroll for{" "}
              <strong>
                {payrollToDelete?.employee?.firstName}{" "}
                {payrollToDelete?.employee?.lastName}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
