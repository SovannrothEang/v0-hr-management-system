import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AttendanceReport {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  attendanceRate: number;
  averageWorkHours: number;
  totalOvertimeHours: number;
}

export interface EmployeeReport {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  newHires: number;
  terminatedEmployees: number;
  departmentBreakdown: {
    department: string;
    count: number;
  }[];
  positionBreakdown: {
    position: string;
    count: number;
  }[];
}

export interface PayrollReport {
  totalPayroll: number;
  averageSalary: number;
  totalDeductions: number;
  totalAllowances: number;
  departmentPayroll: {
    department: string;
    total: number;
  }[];
  payrollTrend: {
    period: string;
    amount: number;
  }[];
}

export interface LeaveReport {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  averageLeaveDays: number;
  leaveTypeBreakdown: {
    type: string;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    count: number;
  }[];
}

export interface ComprehensiveReport {
  attendance: AttendanceReport;
  employee: EmployeeReport;
  payroll: PayrollReport;
  leave: LeaveReport;
  generatedAt: string;
}

export function useAttendanceReport(params: {
  startDate: string;
  endDate: string;
  department?: string;
}) {
  return useQuery({
    queryKey: ["reports", "attendance", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set("startDate", params.startDate);
      queryParams.set("endDate", params.endDate);
      if (params.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<AttendanceReport>(
        `/reports/attendance?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

export function useEmployeeReport(params?: { department?: string }) {
  return useQuery({
    queryKey: ["reports", "employee", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<EmployeeReport>(
        `/reports/employee?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

export function usePayrollReport(params: {
  startDate: string;
  endDate: string;
  department?: string;
}) {
  return useQuery({
    queryKey: ["reports", "payroll", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set("startDate", params.startDate);
      queryParams.set("endDate", params.endDate);
      if (params.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<PayrollReport>(
        `/reports/payroll?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

export function useLeaveReport(params: {
  startDate: string;
  endDate: string;
  department?: string;
}) {
  return useQuery({
    queryKey: ["reports", "leave", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set("startDate", params.startDate);
      queryParams.set("endDate", params.endDate);
      if (params.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<LeaveReport>(
        `/reports/leave?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

export function useComprehensiveReport(params: {
  startDate: string;
  endDate: string;
  department?: string;
}) {
  return useQuery({
    queryKey: ["reports", "comprehensive", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set("startDate", params.startDate);
      queryParams.set("endDate", params.endDate);
      if (params.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<ComprehensiveReport>(
        `/reports/comprehensive?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}
