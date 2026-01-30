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
      const response = await apiClient.get<DashboardStats | { data: DashboardStats }>("/dashboard/stats");
      // Handle both internal API (object) and external API (object with data property)
      return (response.data as any).data || response.data;
    },
  });
}

export function useAttendanceTrend(days: number = 7) {
  return useQuery({
    queryKey: ["dashboard", "attendance-trend", days],
    queryFn: async () => {
      const response = await apiClient.get<{ trend: AttendanceTrend[]; days: number } | AttendanceTrend[]>(
        `/dashboard/attendance-trend?days=${days}`
      );
      // Handle both internal API (array) and external API (object with trend array)
      return Array.isArray(response.data) ? response.data : (response.data as any).trend || [];
    },
  });
}

export function useDepartmentDistribution() {
  return useQuery({
    queryKey: ["dashboard", "department-distribution"],
    queryFn: async () => {
      const response = await apiClient.get<{ departments: DepartmentDistribution[]; totalEmployees: number } | DepartmentDistribution[]>(
        "/dashboard/department-distribution"
      );
      // Handle both internal API (array) and external API (object with departments array)
      return Array.isArray(response.data) ? response.data : (response.data as any).departments || [];
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async () => {
      const response = await apiClient.get<{ activities: RecentActivity[]; count: number }>(
        "/dashboard/recent-activity"
      );
      // Handle both internal API (array) and external API (object with activities array)
      return Array.isArray(response.data) ? response.data : response.data.activities || [];
    },
  });
}
