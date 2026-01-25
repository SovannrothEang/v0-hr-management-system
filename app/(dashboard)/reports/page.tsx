"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportFilters } from "@/components/reports/report-filters";
import { AttendanceReportCard } from "@/components/reports/attendance-report-card";
import { EmployeeReportCard } from "@/components/reports/employee-report-card";
import { PayrollReportCard } from "@/components/reports/payroll-report-card";
import { LeaveReportCard } from "@/components/reports/leave-report-card";
import {
  useAttendanceReport,
  useEmployeeReport,
  usePayrollReport,
  useLeaveReport,
} from "@/hooks/use-reports";
import { Download, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [department, setDepartment] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  const dateParams = {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
    department,
  };

  const { data: attendanceData, isLoading: attendanceLoading } =
    useAttendanceReport(dateParams);
  const { data: employeeData, isLoading: employeeLoading } = useEmployeeReport({
    department,
  });
  const { data: payrollData, isLoading: payrollLoading } =
    usePayrollReport(dateParams);
  const { data: leaveData, isLoading: leaveLoading } = useLeaveReport(dateParams);

  const handleExport = () => {
    toast.success("Report export started", {
      description: "Your report will be downloaded shortly",
    });
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
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </PageHeader>

      <ReportFilters
        startDate={startDate}
        endDate={endDate}
        department={department}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onDepartmentChange={setDepartment}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="overview">
            <FileText className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <AttendanceReportCard
            data={attendanceData}
            isLoading={attendanceLoading}
          />
          <EmployeeReportCard data={employeeData} isLoading={employeeLoading} />
          <PayrollReportCard data={payrollData} isLoading={payrollLoading} />
          <LeaveReportCard data={leaveData} isLoading={leaveLoading} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceReportCard
            data={attendanceData}
            isLoading={attendanceLoading}
          />
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <EmployeeReportCard data={employeeData} isLoading={employeeLoading} />
        </TabsContent>

        <TabsContent value="payroll" className="mt-6">
          <PayrollReportCard data={payrollData} isLoading={payrollLoading} />
        </TabsContent>

        <TabsContent value="leave" className="mt-6">
          <LeaveReportCard data={leaveData} isLoading={leaveLoading} />
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
