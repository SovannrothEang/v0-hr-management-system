"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PayrollSummaryCards } from "@/components/payrolls/payroll-summary-cards";
import { PayrollTable } from "@/components/payrolls/payroll-table";
import { PayslipDialog } from "@/components/payrolls/payslip-dialog";
import { GeneratePayrollDialog } from "@/components/payrolls/generate-payroll-dialog";
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
import { FileSpreadsheet, Download, Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { usePayrollRecords, usePayrollSummary } from "@/hooks/use-payroll";

const months = [
  { name: "January", value: 1 },
  { name: "February", value: 2 },
  { name: "March", value: 3 },
  { name: "April", value: 4 },
  { name: "May", value: 5 },
  { name: "June", value: 6 },
  { name: "July", value: 7 },
  { name: "August", value: 8 },
  { name: "September", value: 9 },
  { name: "October", value: 10 },
  { name: "November", value: 11 },
  { name: "December", value: 12 },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const years = [currentYear - 1, currentYear, currentYear + 1];

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState("");
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: payrollResponse, isLoading } = usePayrollRecords({
    month: selectedMonth,
    year: selectedYear,
    page: currentPage,
    limit: pageSize,
  });

  const { data: summary } = usePayrollSummary({
    month: selectedMonth,
    year: selectedYear,
  });

  const payrolls = payrollResponse?.data || [];
  const meta = payrollResponse?.meta;

  const handleViewPayslip = (payrollId: string) => {
    setSelectedPayrollId(payrollId);
    setPayslipDialogOpen(true);
  };

  const filteredPayrolls = searchQuery
    ? payrolls.filter(
        (p) =>
          `${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          p.employee?.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : payrolls;

  const handlePreviousPage = () => {
    if (meta?.hasPrevious) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (meta?.hasNext) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handleMonthChange = (v: string) => {
    setSelectedMonth(parseInt(v));
    setCurrentPage(1);
  };

  const handleYearChange = (v: string) => {
    setSelectedYear(parseInt(v));
    setCurrentPage(1);
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

      <PayrollSummaryCards summary={summary} />

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
              <Select
                value={selectedMonth.toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[130px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={handleYearChange}
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
        <CardContent className="space-y-4">
          <PayrollTable
            records={filteredPayrolls}
            isLoading={isLoading}
            onViewPayslip={handleViewPayslip}
          />

          {meta && meta.total > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {meta.page * meta.limit - meta.limit + 1} to{" "}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} records
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(v) => {
                      setPageSize(parseInt(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {meta.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={!meta.hasPrevious}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!meta.hasNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
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