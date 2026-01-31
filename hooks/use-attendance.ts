import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AttendanceRecord, LeaveRequest } from "@/stores/attendance-store";
import type { PaginatedResponse } from "@/types/pagination";
import { toast } from "sonner";

/**
 * Transform API attendance data to frontend interface
 */
function transformAttendance(att: any): AttendanceRecord {
  return {
    id: att.id,
    employeeId: att.employeeId,
    date: att.date,
    clockIn: att.checkInTime || att.clockIn,
    clockOut: att.checkOutTime || att.clockOut,
    status: att.status?.toLowerCase() || att.status,
    workHours: att.workHours,
    overtime: att.overtime,
    notes: att.notes,
    performBy: att.performBy,
    performer: att.performer,
    employee: att.employee,
    isActive: att.isActive ?? true,
    createdAt: att.createdAt,
    updatedAt: att.updatedAt,
  };
}

export function useAttendanceRecords(params?: {
  date?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["attendance", params],
    queryFn: async (): Promise<PaginatedResponse<AttendanceRecord>> => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.set("date", params.date);
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);
      if (params?.startDate) queryParams.set("startDate", params.startDate);
      if (params?.endDate) queryParams.set("endDate", params.endDate);
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());

      const response = await apiClient.get<AttendanceRecord[] | PaginatedResponse<AttendanceRecord>>(
        `/attendance?${queryParams.toString()}`
      );

      const data = response.data;

      // Handle both internal API (array) and external API (paginated response)
      if (Array.isArray(data)) {
        // Legacy array response - wrap in paginated structure
        const transformedData = data.map(transformAttendance);
        const total = transformedData.length;
        const limit = params?.limit || 10;
        const totalPages = Math.ceil(total / limit);
        const page = params?.page || 1;

        return {
          data: transformedData,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
          },
        };
      }

      // Paginated response from external API
      if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        return {
          data: data.data.map(transformAttendance),
          meta: data.meta || {
            page: params?.page || 1,
            limit: params?.limit || 10,
            total: data.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }

      // Fallback for unexpected response
      return {
        data: [],
        meta: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };
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
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["leave-requests", params],
    queryFn: async (): Promise<PaginatedResponse<LeaveRequest>> => {
      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== "all")
        queryParams.set("status", params.status);
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());

      const response = await apiClient.get<LeaveRequest[] | PaginatedResponse<LeaveRequest>>(
        `/leave-requests?${queryParams.toString()}`
      );

      const data = response.data;

      // Handle both internal API (array) and external API (paginated response)
      if (Array.isArray(data)) {
        // Legacy array response - wrap in paginated structure
        const total = data.length;
        const limit = params?.limit || 10;
        const totalPages = Math.ceil(total / limit);
        const page = params?.page || 1;

        return {
          data,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
          },
        };
      }

      // Paginated response from external API
      if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        return {
          data: data.data,
          meta: data.meta || {
            page: params?.page || 1,
            limit: params?.limit || 10,
            total: data.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }

      // Fallback for unexpected response
      return {
        data: [],
        meta: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };
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
