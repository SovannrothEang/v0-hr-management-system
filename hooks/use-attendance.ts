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
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.set("date", params.date);
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);
      if (params?.startDate) queryParams.set("startDate", params.startDate);
      if (params?.endDate) queryParams.set("endDate", params.endDate);

      const response = await apiClient.get<AttendanceRecord[]>(
        `/attendance?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await apiClient.post<AttendanceRecord>(
        "/attendance/clock-in",
        { employeeId }
      );
      return response.data;
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
    mutationFn: async (employeeId: string) => {
      const response = await apiClient.post<AttendanceRecord>(
        "/attendance/clock-out",
        { employeeId }
      );
      return response.data;
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
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== "all")
        queryParams.set("status", params.status);
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);

      const response = await apiClient.get<LeaveRequest[]>(
        `/leave-requests?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<LeaveRequest>) => {
      const response = await apiClient.post<LeaveRequest>("/leave-requests", data);
      return response.data;
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
    }) => {
      const response = await apiClient.put<LeaveRequest>(`/leave-requests/${id}`, {
        status,
        approvedBy,
      });
      return response.data;
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
