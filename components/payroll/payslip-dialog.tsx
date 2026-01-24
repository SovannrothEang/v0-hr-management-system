"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Printer } from "lucide-react";

interface PayslipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollId: string | null;
}

// Mock payslip data - in production this would come from API
const mockPayslipData = {
  id: "1",
  employee: {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@company.com",
    employeeId: "EMP001",
    department: "Engineering",
    position: "Senior Software Engineer",
  },
  period: "January 2026",
  payDate: "2026-01-31",
  earnings: {
    basicSalary: 8500,
    housingAllowance: 1200,
    transportAllowance: 500,
    mealAllowance: 300,
    overtimePay: 850,
  },
  deductions: {
    incomeTax: 1700,
    socialSecurity: 425,
    healthInsurance: 200,
    pensionContribution: 425,
  },
  summary: {
    grossEarnings: 11350,
    totalDeductions: 2750,
    netPay: 8600,
  },
};

export function PayslipDialog({ open, onOpenChange }: PayslipDialogProps) {
  const payslip = mockPayslipData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payslip - {payslip.period}</span>
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
          {/* Company Header */}
          <div className="text-center pb-4 border-b border-border">
            <h2 className="text-xl font-bold text-primary">HRFlow Inc.</h2>
            <p className="text-sm text-muted-foreground">
              123 Business Street, Tech City, TC 12345
            </p>
            <p className="text-sm text-muted-foreground">
              Tel: (555) 123-4567 | Email: hr@hrflow.com
            </p>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-secondary/30 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Employee Details
              </h3>
              <p className="font-medium text-foreground">
                {payslip.employee.firstName} {payslip.employee.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                ID: {payslip.employee.employeeId}
              </p>
              <p className="text-sm text-muted-foreground">
                {payslip.employee.position}
              </p>
              <p className="text-sm text-muted-foreground">
                {payslip.employee.department}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Pay Period
              </h3>
              <p className="font-medium text-foreground">{payslip.period}</p>
              <p className="text-sm text-muted-foreground">
                Pay Date: {new Date(payslip.payDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Earnings */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Earnings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Basic Salary</span>
                <span className="font-medium text-foreground">
                  ${payslip.earnings.basicSalary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Housing Allowance</span>
                <span className="font-medium text-foreground">
                  ${payslip.earnings.housingAllowance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Transport Allowance</span>
                <span className="font-medium text-foreground">
                  ${payslip.earnings.transportAllowance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Meal Allowance</span>
                <span className="font-medium text-foreground">
                  ${payslip.earnings.mealAllowance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Overtime Pay</span>
                <span className="font-medium text-foreground">
                  ${payslip.earnings.overtimePay.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 bg-success/10 px-3 rounded">
                <span className="font-semibold text-success">Gross Earnings</span>
                <span className="font-bold text-success">
                  ${payslip.summary.grossEarnings.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Deductions
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Income Tax</span>
                <span className="font-medium text-destructive">
                  -${payslip.deductions.incomeTax.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Social Security</span>
                <span className="font-medium text-destructive">
                  -${payslip.deductions.socialSecurity.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Health Insurance</span>
                <span className="font-medium text-destructive">
                  -${payslip.deductions.healthInsurance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Pension Contribution</span>
                <span className="font-medium text-destructive">
                  -${payslip.deductions.pensionContribution.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 bg-destructive/10 px-3 rounded">
                <span className="font-semibold text-destructive">Total Deductions</span>
                <span className="font-bold text-destructive">
                  -${payslip.summary.totalDeductions.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-foreground">Net Pay</span>
              <span className="text-2xl font-bold text-primary">
                ${payslip.summary.netPay.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground pt-4 border-t border-border">
            This is a computer-generated payslip and does not require a signature.
            For any queries, please contact HR department.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
