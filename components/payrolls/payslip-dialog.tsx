"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Printer } from "lucide-react";
import { usePayrollById } from "@/hooks/use-payroll";
import type { PayrollRecord, PayrollItem } from "@/types";

interface PayslipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollId: string | null;
}

function formatCurrency(amount: number | undefined, currency: string = 'USD') {
  return `${currency === 'USD' ? '$' : ''}${(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PayslipDialog({ open, onOpenChange, payrollId }: PayslipDialogProps) {
  const { data: payroll, isLoading } = usePayrollById(payrollId);

  const earnings = payroll?.items?.filter((item: PayrollItem) => item.itemType === 'EARNING') || [];
  const deductions = payroll?.items?.filter((item: PayrollItem) => item.itemType === 'DEDUCTION') || [];

  const totalEarnings = earnings.reduce((sum: number, item: PayrollItem) => sum + item.amount, 0);
  const totalDeductions = deductions.reduce((sum: number, item: PayrollItem) => sum + item.amount, 0);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!payroll) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-center py-8">
            Unable to load payslip data.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payslip - {payroll.period}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center pb-4 border-b border-border">
            <h2 className="text-xl font-bold text-primary">HRFlow Inc.</h2>
            <p className="text-sm text-muted-foreground">
              123 Business Street, Tech City, TC 12345
            </p>
            <p className="text-sm text-muted-foreground">
              Tel: (555) 123-4567 | Email: hr@hrflow.com
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 p-4 bg-secondary/30 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Employee Details
              </h3>
              <p className="font-medium text-foreground">
                {payroll.employee?.firstName} {payroll.employee?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                ID: {payroll.employee?.employeeId}
              </p>
              <p className="text-sm text-muted-foreground">
                {payroll.employee?.position}
              </p>
              <p className="text-sm text-muted-foreground">
                {payroll.employee?.department}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Pay Period
              </h3>
              <p className="font-medium text-foreground">{payroll.period}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(payroll.payPeriodStart).toLocaleDateString()} - {new Date(payroll.payPeriodEnd).toLocaleDateString()}
              </p>
              {payroll.paymentDate && (
                <p className="text-sm text-muted-foreground">
                  Pay Date: {new Date(payroll.paymentDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Earnings
            </h3>
            <div className="space-y-2">
              {earnings.length > 0 ? (
                earnings.map((item: PayrollItem) => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">{item.itemName}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.amount, payroll.currencyCode)}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(payroll.basicSalary, payroll.currencyCode)}
                    </span>
                  </div>
                  {payroll.overtimePay > 0 && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Overtime Pay ({payroll.overtimeHrs}h @ {formatCurrency(payroll.overtimeRate, payroll.currencyCode)}/h)</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(payroll.overtimePay, payroll.currencyCode)}
                      </span>
                    </div>
                  )}
                  {payroll.bonus > 0 && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Bonus</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(payroll.bonus, payroll.currencyCode)}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between py-2 bg-success/10 px-3 rounded">
                <span className="font-semibold text-success">Gross Earnings</span>
                <span className="font-bold text-success">
                  {formatCurrency(payroll.grossSalary || totalEarnings, payroll.currencyCode)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Deductions
            </h3>
            <div className="space-y-2">
              {deductions.length > 0 ? (
                deductions.map((item: PayrollItem) => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">{item.itemName}</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(item.amount, payroll.currencyCode)}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  {payroll.taxCalculation && payroll.taxCalculation.taxAmount > 0 && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        Income Tax ({(payroll.taxCalculation.taxRateUsed * 100).toFixed(1)}%)
                      </span>
                      <span className="font-medium text-destructive">
                        -{formatCurrency(payroll.taxCalculation.taxAmount, payroll.currencyCode)}
                      </span>
                    </div>
                  )}
                  {payroll.deductions > 0 && !payroll.taxCalculation && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Other Deductions</span>
                      <span className="font-medium text-destructive">
                        -{formatCurrency(payroll.deductions, payroll.currencyCode)}
                      </span>
                    </div>
                  )}
                </>
              )}
              {(!deductions.length && !payroll.taxCalculation?.taxAmount && payroll.deductions <= 0) && (
                <div className="flex justify-between py-2 text-muted-foreground">
                  <span>No deductions</span>
                  <span>$0.00</span>
                </div>
              )}
              <div className="flex justify-between py-2 bg-destructive/10 px-3 rounded">
                <span className="font-semibold text-destructive">Total Deductions</span>
                <span className="font-bold text-destructive">
                  -{formatCurrency(totalDeductions || payroll.deductions || 0, payroll.currencyCode)}
                </span>
              </div>
            </div>
          </div>

          {payroll.taxCalculation && (
            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="text-sm font-semibold text-foreground mb-2">Tax Calculation Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Income:</span>
                  <span>{formatCurrency(payroll.taxCalculation.grossIncome, payroll.currencyCode)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxable Income:</span>
                  <span>{formatCurrency(payroll.taxCalculation.taxableIncome, payroll.currencyCode)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax Rate:</span>
                  <span>{(payroll.taxCalculation.taxRateUsed * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax Amount:</span>
                  <span className="text-destructive">{formatCurrency(payroll.taxCalculation.taxAmount, payroll.currencyCode)}</span>
                </div>
              </div>
            </div>
          )}

          {payroll.exchangeRate && payroll.baseCurrencyCode && payroll.baseCurrencyAmount && (
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h3 className="text-sm font-semibold text-foreground mb-2">Currency Conversion</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exchange Rate:</span>
                  <span>1 {payroll.currencyCode} = {payroll.exchangeRate.toLocaleString()} {payroll.baseCurrencyCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount in {payroll.baseCurrencyCode}:</span>
                  <span>{payroll.baseCurrencyAmount.toLocaleString()} {payroll.baseCurrencyCode}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-semibold text-foreground">Net Pay</span>
                <p className="text-xs text-muted-foreground">{payroll.currencyCode}</p>
              </div>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(payroll.netSalary, payroll.currencyCode)}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Status: <span className="capitalize font-medium text-foreground">{payroll.status}</span></span>
            {payroll.processedAt && (
              <span>Processed: {new Date(payroll.processedAt).toLocaleDateString()}</span>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground pt-4 border-t border-border">
            This is a computer-generated payslip and does not require a signature.
            For any queries, please contact HR department.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
