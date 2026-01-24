import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaveRequests: number;
  newHiresThisMonth: number;
  upcomingPayroll: number;
  attendanceRate: number;
  averageWorkHours: number;
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
}

export interface DepartmentDistribution {
  department: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: "attendance" | "leave" | "payroll" | "employee";
  message: string;
  timestamp: string;
  employeeName?: string;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await apiClient.get<DashboardStats>("/dashboard/stats");
      return response.data;
    },
  });
}

export function useAttendanceTrend(days: number = 7) {
  return useQuery({
    queryKey: ["dashboard", "attendance-trend", days],
    queryFn: async () => {
      const response = await apiClient.get<AttendanceTrend[]>(
        `/dashboard/attendance-trend?days=${days}`
      );
      return response.data;
    },
  });
}

export function useDepartmentDistribution() {
  return useQuery({
    queryKey: ["dashboard", "department-distribution"],
    queryFn: async () => {
      const response = await apiClient.get<DepartmentDistribution[]>(
        "/dashboard/department-distribution"
      );
      return response.data;
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async () => {
      const response = await apiClient.get<RecentActivity[]>(
        "/dashboard/recent-activity"
      );
      return response.data;
    },
  });
}
