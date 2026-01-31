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
    queryFn: async (): Promise<AttendanceReport> => {
      const queryParams = new URLSearchParams();
      queryParams.set("startDate", params.startDate);
      queryParams.set("endDate", params.endDate);
      if (params.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<AttendanceReport | { data: AttendanceReport }>(
        `/reports/attendance?${queryParams.toString()}`
      );
      const resData = response.data;
      const data = (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;

      // Ensure all fields have defaults
      if (data && typeof data === 'object') {
        data.totalDays = data.totalDays ?? 0;
        data.presentDays = data.presentDays ?? 0;
        data.absentDays = data.absentDays ?? 0;
        data.lateDays = data.lateDays ?? 0;
        data.leaveDays = data.leaveDays ?? 0;
        data.attendanceRate = data.attendanceRate ?? 0;
        data.averageWorkHours = data.averageWorkHours ?? 0;
        data.totalOvertimeHours = data.totalOvertimeHours ?? 0;
      }

      return data;
    },
  });
}

export function useEmployeeReport(params?: { department?: string }) {
  return useQuery({
    queryKey: ["reports", "employee", params],
    queryFn: async (): Promise<EmployeeReport> => {
      const queryParams = new URLSearchParams();
      if (params?.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<EmployeeReport | { data: EmployeeReport }>(
        `/reports/employee?${queryParams.toString()}`
      );
      const resData = response.data;
      const data = (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;

      // Ensure breakdown fields and stats exist
      if (data && typeof data === 'object') {
        data.totalEmployees = data.totalEmployees ?? 0;
        data.activeEmployees = data.activeEmployees ?? 0;
        data.onLeaveEmployees = data.onLeaveEmployees ?? 0;
        data.newHires = data.newHires ?? 0;
        data.terminatedEmployees = data.terminatedEmployees ?? 0;
        if (!data.departmentBreakdown) data.departmentBreakdown = [];
        if (!data.positionBreakdown) data.positionBreakdown = [];
      }

      return data;
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
    queryFn: async (): Promise<PayrollReport> => {
      const queryParams = new URLSearchParams();
      queryParams.set("startDate", params.startDate);
      queryParams.set("endDate", params.endDate);
      if (params.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<PayrollReport | { data: PayrollReport }>(
        `/reports/payroll?${queryParams.toString()}`
      );
      const resData = response.data;
      const data = (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;

      // Ensure breakdown fields and stats exist
      if (data && typeof data === 'object') {
        data.totalPayroll = data.totalPayroll ?? 0;
        data.averageSalary = data.averageSalary ?? 0;
        data.totalDeductions = data.totalDeductions ?? 0;
        data.totalAllowances = data.totalAllowances ?? 0;
        if (!data.departmentPayroll) data.departmentPayroll = [];
        if (!data.payrollTrend) data.payrollTrend = [];
      }

      return data;
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
    queryFn: async (): Promise<LeaveReport> => {
      const queryParams = new URLSearchParams();
      queryParams.set("startDate", params.startDate);
      queryParams.set("endDate", params.endDate);
      if (params.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<LeaveReport | { data: LeaveReport }>(
        `/reports/leave?${queryParams.toString()}`
      );
      const resData = response.data;
      const data = (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;

      // Ensure breakdown fields and stats exist
      if (data && typeof data === 'object') {
        data.totalRequests = data.totalRequests ?? 0;
        data.approvedRequests = data.approvedRequests ?? 0;
        data.rejectedRequests = data.rejectedRequests ?? 0;
        data.pendingRequests = data.pendingRequests ?? 0;
        data.averageLeaveDays = data.averageLeaveDays ?? 0;
        if (!data.leaveTypeBreakdown) data.leaveTypeBreakdown = [];
        if (!data.monthlyTrend) data.monthlyTrend = [];
      }

      return data;
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
    queryFn: async (): Promise<ComprehensiveReport> => {
      const queryParams = new URLSearchParams();
      queryParams.set("startDate", params.startDate);
      queryParams.set("endDate", params.endDate);
      if (params.department && params.department !== "all") {
        queryParams.set("department", params.department);
      }

      const response = await apiClient.get<ComprehensiveReport | { data: ComprehensiveReport }>(
        `/reports/comprehensive?${queryParams.toString()}`
      );
      const resData = response.data;
      const data = (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;

      // Ensure all sub-reports have their breakdowns
      if (data && typeof data === 'object') {
        if (data.employee) {
          if (!data.employee.departmentBreakdown) data.employee.departmentBreakdown = [];
          if (!data.employee.positionBreakdown) data.employee.positionBreakdown = [];
        }
        if (data.payroll) {
          if (!data.payroll.departmentPayroll) data.payroll.departmentPayroll = [];
          if (!data.payroll.payrollTrend) data.payroll.payrollTrend = [];
        }
        if (data.leave) {
          if (!data.leave.leaveTypeBreakdown) data.leave.leaveTypeBreakdown = [];
          if (!data.leave.monthlyTrend) data.leave.monthlyTrend = [];
        }
      }

      return data;
    },
  });
}
