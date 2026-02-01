import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AttendanceRecord, LeaveRequest, LeaveStatus, LeaveType } from "@/stores/attendance-store";
import type { PaginatedResponse } from "@/types/pagination";
import { toast } from "sonner";

/**
 * Transform API attendance data to frontend interface
 */
function transformAttendance(att: any): AttendanceRecord {
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return undefined;
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return dateStr;
    }
  };

  return {
    id: att.id,
    employeeId: att.employeeId,
    date: att.date,
    clockIn: formatTime(att.checkInTime || att.clockIn),
    clockOut: formatTime(att.checkOutTime || att.clockOut),
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

/**
 * Transform API leave request data to frontend interface
 */
function transformLeaveRequest(lr: any): LeaveRequest {
  // Map API SICK_LEAVE to sick, etc.
  const typeMap: Record<string, LeaveType> = {
    'ANNUAL_LEAVE': 'annual',
    'SICK_LEAVE': 'sick',
    'PERSONAL_LEAVE': 'personal',
    'MATERNITY_LEAVE': 'maternity',
    'PATERNITY_LEAVE': 'paternity',
    'UNPAID_LEAVE': 'unpaid'
  };

  // Status mapping
  const status = lr.status?.toLowerCase() || 'pending';
  const type = typeMap[lr.leaveType] || lr.type?.toLowerCase() || 'annual';

  // Robust extraction from the new nested employee object (Priority: API DTO structure)
  const emp = lr.employee || {};
  const employeeName = lr.employeeName ||
    (emp.firstname ? `${emp.firstname} ${emp.lastname || ''}`.trim() : null) ||
    emp.name ||
    (emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : null) ||
    'Unknown Employee';

  return {
    id: lr.id,
    employeeId: lr.employeeId,
    employeeName,
    employeeAvatar: emp.profileImage || emp.avatar,
    employee: emp,
    type: type as LeaveType,
    startDate: lr.startDate,
    endDate: lr.endDate,
    days: lr.days || lr.totalDays || 0,
    reason: lr.reason,
    status: status as LeaveStatus,
    reviewedBy: lr.approver?.firstname ? `${lr.approver.firstname} ${lr.approver.lastname || ''}`.trim() : (lr.approver?.name || lr.reviewedBy || lr.approvedBy),
    reviewedAt: lr.reviewedAt || lr.approvedAt || lr.updatedAt,
    createdAt: lr.createdAt,
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
      if (data && typeof data === 'object') {
        const innerData = (data as any).data || data;
        const meta = (data as any).meta || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: Array.isArray(innerData) ? innerData.length : 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        if (Array.isArray(innerData)) {
          return {
            data: innerData.map(transformAttendance),
            meta,
          };
        }
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
        const transformedData = data.map(transformLeaveRequest);
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
      if (data && typeof data === 'object') {
        const innerData = (data as any).data || data;
        const meta = (data as any).meta || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: Array.isArray(innerData) ? innerData.length : 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        if (Array.isArray(innerData)) {
          return {
            data: innerData.map(transformLeaveRequest),
            meta,
          };
        }
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
      // Map frontend leaveType to backend enum
      const typeMap: Record<string, string> = {
        'annual': 'ANNUAL_LEAVE',
        'sick': 'SICK_LEAVE',
        'personal': 'PERSONAL_LEAVE',
        'maternity': 'MATERNITY_LEAVE',
        'paternity': 'PATERNITY_LEAVE',
        'unpaid': 'UNPAID_LEAVE'
      };

      const payload = {
        ...data,
        leaveType: typeMap[data.type as string] || data.type,
      };

      const response = await apiClient.post<LeaveRequest | { data: LeaveRequest }>("/leave-requests", payload);
      const resData = response.data;
      return (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
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
      approverId,
    }: {
      id: string;
      status: "approved" | "rejected";
      approverId?: string;
    }): Promise<LeaveRequest> => {
      // Backend expects SCREAMING_SNAKE_CASE status
      const backendStatus = status.toUpperCase();

      const response = await apiClient.patch<LeaveRequest | { data: LeaveRequest }>(`/leave-requests/${id}`, {
        status: backendStatus,
        approverId,
      });
      const resData = response.data;
      return (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
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
