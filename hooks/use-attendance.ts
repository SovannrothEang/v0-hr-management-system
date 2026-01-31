import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AttendanceRecord, LeaveRequest } from "@/stores/attendance-store";
import { toast } from "sonner";

export function useAttendanceRecords(params?: {
  date?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["attendance", params],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.set("date", params.date);
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);
      if (params?.startDate) queryParams.set("startDate", params.startDate);
      if (params?.endDate) queryParams.set("endDate", params.endDate);

      const response = await apiClient.get<AttendanceRecord[] | { data: AttendanceRecord[] }>(
        `/attendance?${queryParams.toString()}`
      );
      // Handle both internal API (array) and external API (object with data array)
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string): Promise<AttendanceRecord> => {
      const response = await apiClient.post<AttendanceRecord | { data: AttendanceRecord }>(
        "/attendance/clock-in",
        { employeeId }
      );
      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? data.data : data as AttendanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Clocked in successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to clock in", { description: error.message });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string): Promise<AttendanceRecord> => {
      const response = await apiClient.post<AttendanceRecord | { data: AttendanceRecord }>(
        "/attendance/clock-out",
        { employeeId }
      );
      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? data.data : data as AttendanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Clocked out successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to clock out", { description: error.message });
    },
  });
}

export function useLeaveRequests(params?: {
  status?: string;
  employeeId?: string;
}) {
  return useQuery({
    queryKey: ["leave-requests", params],
    queryFn: async (): Promise<LeaveRequest[]> => {
      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== "all")
        queryParams.set("status", params.status);
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);

      const response = await apiClient.get<LeaveRequest[] | { data: LeaveRequest[] }>(
        `/leave-requests?${queryParams.toString()}`
      );
      // Handle both internal API (array) and external API (object with data array)
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
      const response = await apiClient.post<LeaveRequest | { data: LeaveRequest }>("/leave-requests", data);
      const resData = response.data;
      return (resData && typeof resData === 'object' && 'data' in resData) ? resData.data : resData as LeaveRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast.success("Leave request submitted");
    },
    onError: (error: Error) => {
      toast.error("Failed to submit leave request", {
        description: error.message,
      });
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      approvedBy,
    }: {
      id: string;
      status: "approved" | "rejected";
      approvedBy: string;
    }): Promise<LeaveRequest> => {
      const response = await apiClient.put<LeaveRequest | { data: LeaveRequest }>(`/leave-requests/${id}`, {
        status,
        approvedBy,
      });
      const resData = response.data;
      return (resData && typeof resData === 'object' && 'data' in resData) ? resData.data : resData as LeaveRequest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast.success(
        `Leave request ${variables.status === "approved" ? "approved" : "rejected"}`
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to update leave request", {
        description: error.message,
      });
    },
  });
}
