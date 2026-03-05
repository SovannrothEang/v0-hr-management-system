"use client";

import { useState } from "react";
import { subDays, startOfDay, format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportsSummaryCards } from "@/components/reports/reports-summary-cards";
import { AttendanceReportCard } from "@/components/reports/attendance-report-card";
import { EmployeeReportCard } from "@/components/reports/employee-report-card";
import { PayrollReportCard } from "@/components/reports/payroll-report-card";
import { LeaveReportCard } from "@/components/reports/leave-report-card";
import { ExportDropdown } from "@/components/reports/export-dropdown";
import {
  useAttendanceReport,
  useEmployeeReport,
  usePayrollReport,
  useLeaveReport,
} from "@/hooks/use-reports";
import { Printer } from "lucide-react";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(subDays(startOfDay(new Date()), 1));
  const [endDate, setEndDate] = useState(startOfDay(new Date()));
  const [department, setDepartment] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  const dateParams = {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
    department,
  };

  const { data: attendanceData, isLoading: attendanceLoading } =
    useAttendanceReport(dateParams);
  const { data: employeeData, isLoading: employeeLoading } = useEmployeeReport(dateParams);
  const { data: payrollData, isLoading: payrollLoading } =
    usePayrollReport(dateParams);
  const { data: leaveData, isLoading: leaveLoading } = useLeaveReport(dateParams);

  const isAnyLoading = attendanceLoading || employeeLoading || payrollLoading || leaveLoading;

  const exportParams: Record<string, string> = {
    startDate: dateParams.startDate,
    endDate: dateParams.endDate,
    ...(department !== "all" && { department }),
  };

  const comprehensiveParams: Record<string, string> = {
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive insights into attendance, employees, payroll, and leave management"
      >
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <ExportDropdown
          endpoint="/reports/comprehensive/export"
          params={comprehensiveParams}
          reportName="comprehensive_report"
        />
      </PageHeader>

      <ReportFilters
        startDate={startDate}
        endDate={endDate}
        department={department}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onDepartmentChange={setDepartment}
      />

      <ReportsSummaryCards
        attendanceData={attendanceData}
        employeeData={employeeData}
        payrollData={payrollData}
        leaveData={leaveData}
        isLoading={isAnyLoading}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <AttendanceReportCard
            data={attendanceData}
            isLoading={attendanceLoading}
            exportParams={exportParams}
          />
          <EmployeeReportCard data={employeeData} isLoading={employeeLoading} exportParams={exportParams} />
          <PayrollReportCard data={payrollData} isLoading={payrollLoading} exportParams={exportParams} />
          <LeaveReportCard data={leaveData} isLoading={leaveLoading} exportParams={exportParams} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceReportCard
            data={attendanceData}
            isLoading={attendanceLoading}
            exportParams={exportParams}
          />
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <EmployeeReportCard data={employeeData} isLoading={employeeLoading} exportParams={exportParams} />
        </TabsContent>

        <TabsContent value="payroll" className="mt-6">
          <PayrollReportCard data={payrollData} isLoading={payrollLoading} exportParams={exportParams} />
        </TabsContent>

        <TabsContent value="leave" className="mt-6">
          <LeaveReportCard data={leaveData} isLoading={leaveLoading} exportParams={exportParams} />
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border print:hidden">
        Report generated on {format(new Date(), "PPpp")} | Date Range:{" "}
        {format(startDate, "PP")} - {format(endDate, "PP")}
        {department !== "all" && ` | Department: ${department}`}
      </div>
    </div>
  );
}
