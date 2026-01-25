"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PayrollSummaryCards } from "@/components/payroll/payroll-summary-cards";
import { PayrollTable } from "@/components/payroll/payroll-table";
import { PayslipDialog } from "@/components/payroll/payslip-dialog";
import { GeneratePayrollDialog } from "@/components/payroll/generate-payroll-dialog";
import { AdminOrHROnly } from "@/components/auth/protected-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Download, Search, Plus } from "lucide-react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(
    months[new Date().getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState("");
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);

  const handleViewPayslip = (payrollId: string) => {
    setSelectedPayrollId(payrollId);
    setPayslipDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Payroll Management"
        description="Process and manage employee payroll, generate payslips, and track payments."
      >
        <AdminOrHROnly>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setGenerateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Generate Payroll
          </Button>
        </AdminOrHROnly>
      </PageHeader>

      <PayrollSummaryCards />

      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Payroll Records
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px] bg-secondary border-border"
                />
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[130px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[100px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PayrollTable
            month={selectedMonth}
            year={selectedYear}
            onViewPayslip={handleViewPayslip}
          />
        </CardContent>
      </Card>

      <PayslipDialog
        open={payslipDialogOpen}
        onOpenChange={setPayslipDialogOpen}
        payrollId={selectedPayrollId}
      />

      <GeneratePayrollDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
      />
    </div>
  );
}
