import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaveRequests: number;
  absentToday: number;
  lateToday: number;
  totalDepartments: number;
  newEmployeesThisMonth: number;
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
    queryFn: async (): Promise<DashboardStats> => {
      const response = await apiClient.get<DashboardStats | { data: DashboardStats }>("/dashboard/stats");
      // Handle both internal API (object) and external API (object with data property)
      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;
    },
  });
}

export function useAttendanceTrend(days: number = 7) {
  return useQuery({
    queryKey: ["dashboard", "attendance-trend", days],
    queryFn: async (): Promise<AttendanceTrend[]> => {
      const response = await apiClient.get<{ trend: AttendanceTrend[]; days: number } | { data: { trend: AttendanceTrend[] } } | AttendanceTrend[] | { data: AttendanceTrend[] }>(
        `/dashboard/attendance-trend?days=${days}`
      );
      // Handle both internal API (array) and external API (object with trend array)
      const data = response.data;
      const actualData = (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;

      if (Array.isArray(actualData)) return actualData;
      return (actualData as any).trend || [];
    },
  });
}

export function useDepartmentDistribution() {
  return useQuery({
    queryKey: ["dashboard", "department-distribution"],
    queryFn: async (): Promise<DepartmentDistribution[]> => {
      const response = await apiClient.get<{ departments: DepartmentDistribution[]; totalEmployees: number } | { data: { departments: DepartmentDistribution[] } } | DepartmentDistribution[] | { data: DepartmentDistribution[] }>(
        "/dashboard/department-distribution"
      );
      // Handle both internal API (array) and external API (object with departments array)
      const data = response.data;
      const actualData = (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;

      if (Array.isArray(actualData)) return actualData;
      return (actualData as any).departments || [];
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async (): Promise<RecentActivity[]> => {
      const response = await apiClient.get<{ activities: RecentActivity[]; count: number } | { data: { activities: RecentActivity[] } } | RecentActivity[] | { data: RecentActivity[] }>(
        "/dashboard/recent-activity"
      );
      // Handle both internal API (array) and external API (object with activities array)
      const data = response.data;
      const actualData = (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;

      if (Array.isArray(actualData)) return actualData;
      return (actualData as any).activities || [];
    },
  });
}
