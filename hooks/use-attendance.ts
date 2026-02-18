import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AttendanceRecord, LeaveRequest, LeaveStatus, LeaveType, AttendanceStatus, AttendanceSummary } from "@/stores/attendance-store";
import type { PaginatedResponse } from "@/types/pagination";
import { toast } from "sonner";
import { getEmployeeAvatarUrl } from "@/hooks/use-employees";

function transformAttendance(att: any): AttendanceRecord {
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return undefined;
    // If it's already in HH:mm format, return it
    if (/^\d{2}:\d{2}$/.test(dateStr)) return dateStr;

    try {
      const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return dateStr;
    }
  };

  // Status mapping for attendance
  const statusMap: Record<string, AttendanceStatus> = {
    'PRESENT': 'present',
    'ABSENT': 'absent',
    'LATE': 'late',
    'EXCUSED': 'excused',
    'EARLY_OUT': 'early_out',
    'OVERTIME': 'overtime',
    'DID_NOT_CHECKOUT': 'did_not_checkout',
  };

  const status = statusMap[att.status] || att.status?.toLowerCase() || 'present';

  return {
    id: att.id,
    employeeId: att.employeeId,
    date: att.date,
    clockIn: formatTime(att.checkInTime || att.clockIn),
    clockOut: formatTime(att.checkOutTime || att.clockOut),
    status: status as AttendanceStatus,
    workHours: att.workHours,
    overtime: att.overtime,
    notes: att.notes,
    performBy: att.performBy,
    performer: att.performer,
    employee: att.employee ? {
      ...att.employee,
      firstName: att.employee.firstname || att.employee.firstName,
      lastName: att.employee.lastname || att.employee.lastName,
      department: att.employee.department?.departmentName || att.employee.department?.name || att.employee.department,
      avatar: getEmployeeAvatarUrl(att.employee.id, att.employee.profileImage || att.employee.avatar),
    } : att.employee,
    isActive: att.isActive ?? true,
    createdAt: att.createdAt,
    updatedAt: att.updatedAt,
  };
}

/**
 * Calculate the number of days between two dates (inclusive)
 */
function calculateLeaveDays(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    // Calculate difference in days (inclusive: add 1)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  } catch {
    return 1;
  }
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

  const employeeData = {
    id: emp.id || lr.employeeId,
    employeeId: emp.employeeCode || emp.employeeId,
    firstName: emp.firstname || emp.firstName,
    lastName: emp.lastname || emp.lastName,
    email: emp.user?.email || emp.email,
    department: emp.department?.departmentName || emp.department?.name || emp.department,
    avatar: getEmployeeAvatarUrl(emp.id || lr.employeeId, emp.profileImage || emp.avatar),
  };

  // Calculate days if not provided by API
  const days = lr.days || lr.totalDays || calculateLeaveDays(lr.startDate, lr.endDate);

  return {
    id: lr.id,
    employeeId: lr.employeeId,
    employeeName,
    employeeAvatar: employeeData.avatar,
    employee: employeeData,
    type: type as LeaveType,
    startDate: lr.startDate,
    endDate: lr.endDate,
    days,
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
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["attendances", params],
    queryFn: async (): Promise<PaginatedResponse<AttendanceRecord> & { summary?: AttendanceSummary }> => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.set("dateFrom", params.date);
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);
      if (params?.dateFrom) queryParams.set("dateFrom", params.dateFrom);
      else if (params?.startDate) queryParams.set("dateFrom", params.startDate);
      if (params?.dateTo) queryParams.set("dateTo", params.dateTo);
      else if (params?.endDate) queryParams.set("dateTo", params.endDate);
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());

      const response = await apiClient.get<any>(
        `/attendances?${queryParams.toString()}`
      );

      const root = response as any;
      const responseData = root.data;

      // Handle the structure: { data: { data: [], summary: {}, meta: {}, ... }, statusCode: 200 }
      // This matches the actual JSON structure provided by the user.
      if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        const records = responseData.data.map(transformAttendance);
        const summary = responseData.summary as AttendanceSummary;
        const meta = responseData.meta || {};

        return {
          data: records,
          summary,
          meta: {
            page: meta.page || responseData.page || params?.page || 1,
            limit: meta.limit || responseData.limit || params?.limit || 10,
            total: meta.total || responseData.total || records.length,
            totalPages: meta.totalPages || responseData.totalPages || 1,
            hasNext: meta.hasNext ?? responseData.hasNext ?? false,
            hasPrevious: meta.hasPrevious ?? responseData.hasPrevious ?? false,
          },
        };
      }

      // Handle the structure: { data: [], summary: {}, meta: {}, ... } at root level
      if (root && Array.isArray(root.data) && root.summary) {
        const records = root.data.map(transformAttendance);
        const summary = root.summary as AttendanceSummary;
        const meta = root.meta || {};

        return {
          data: records,
          summary,
          meta: {
            page: meta.page || root.page || params?.page || 1,
            limit: meta.limit || root.limit || params?.limit || 10,
            total: meta.total || root.total || records.length,
            totalPages: meta.totalPages || root.totalPages || 1,
            hasNext: meta.hasNext ?? root.hasNext ?? false,
            hasPrevious: meta.hasPrevious ?? root.hasPrevious ?? false,
          },
        };
      }

      // Fallback for previous structures or legacy array response
      const data = responseData;

      if (Array.isArray(data)) {
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

      if (data && typeof data === 'object') {
        const paginatedData = data as any;
        const innerData = paginatedData.data || [];
        const transformedData = Array.isArray(innerData) ? innerData.map(transformAttendance) : [];

        const total = paginatedData.meta?.total ??
          paginatedData.total ??
          transformedData.length;

        const meta = paginatedData.meta || {};
        const metaLimit = meta.limit ?? paginatedData.limit ?? params?.limit ?? 10;
        const page = meta.page ?? paginatedData.page ?? params?.page ?? 1;
        const totalPages = meta.totalPages ?? paginatedData.totalPages ?? Math.ceil(total / metaLimit);

        return {
          data: transformedData,
          meta: {
            ...meta,
            page,
            limit: metaLimit,
            total,
            totalPages,
            hasNext: meta.hasNext ?? paginatedData.hasNext ?? page < totalPages,
            hasPrevious: meta.hasPrevious ?? paginatedData.hasPrevious ?? page > 1,
          },
        };
      }

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
        "/attendances/clock-in",
        { employeeId }
      );
      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? data.data : data as AttendanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
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
        "/attendances/clock-out",
        { employeeId }
      );
      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? data.data : data as AttendanceRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
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
      queryParams.set("sortBy", "createdAt");
      queryParams.set("sortOrder", "desc");

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
        const paginatedData = data as any;
        const innerData = paginatedData.data || (Array.isArray(data) ? data : []);
        const transformedData = Array.isArray(innerData) ? innerData.map(transformLeaveRequest) : [];

        // Robust metadata extraction: check both .meta and top-level properties
        const total = paginatedData.meta?.total ??
          paginatedData.total ??
          paginatedData.total_count ??
          paginatedData.totalCount ??
          paginatedData.count ??
          transformedData.length;

        const meta = paginatedData.meta || {};
        const metaLimit = meta.limit ?? paginatedData.limit ?? params?.limit ?? 10;
        const page = meta.page ?? paginatedData.page ?? params?.page ?? 1;
        const totalPages = meta.totalPages ?? paginatedData.totalPages ?? Math.ceil(total / metaLimit);

        return {
          data: transformedData,
          meta: {
            ...meta,
            page,
            limit: metaLimit,
            total,
            totalPages,
            hasNext: meta.hasNext ?? paginatedData.hasNext ?? page < totalPages,
            hasPrevious: meta.hasPrevious ?? paginatedData.hasPrevious ?? page > 1,
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
    }: {
      id: string;
      status: "approved" | "rejected";
    }): Promise<LeaveRequest> => {
      // Backend expects SCREAMING_SNAKE_CASE status
      const backendStatus = status.toUpperCase();

      const response = await apiClient.patch<LeaveRequest | { data: LeaveRequest }>(`/leave-requests/${id}/status`, {
        status: backendStatus,
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
