import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: string;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeLeaveBalance {
  employeeId: string;
  employeeName: string;
  balances: LeaveBalance[];
  year: number;
}

export interface CreateLeaveBalanceData {
  employeeId: string;
  leaveType: string;
  year: number;
  totalDays: number;
}

export interface BulkCreateLeaveBalanceData {
  employeeId: string;
  year: number;
  balances: Record<string, number>;
}

export interface UpdateLeaveBalanceData {
  totalDays: number;
}

function transformLeaveBalance(balance: any): LeaveBalance {
  return {
    id: balance.id,
    employeeId: balance.employeeId,
    leaveType: balance.leaveType || balance.leave_type,
    year: balance.year,
    totalDays: Number(balance.totalDays ?? balance.total_days ?? 0),
    usedDays: Number(balance.usedDays ?? balance.used_days ?? 0),
    pendingDays: Number(balance.pendingDays ?? balance.pending_days ?? 0),
    availableDays: Number(balance.availableDays ?? balance.available_days ?? 0),
    createdAt: balance.createdAt || balance.created_at,
    updatedAt: balance.updatedAt || balance.updated_at,
  };
}

export function useLeaveBalances(params?: {
  employeeId?: string;
  year?: number;
  leaveType?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["leave-balances", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);
      if (params?.year) queryParams.set("year", params.year.toString());
      if (params?.leaveType) queryParams.set("leaveType", params.leaveType);
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());

      const response = await apiClient.get<any>(
        `/leave-balances?${queryParams.toString()}`
      );
      const resData = response.data;
      
      const data = Array.isArray(resData?.data) 
        ? resData.data 
        : Array.isArray(resData) 
          ? resData 
          : [];
      
      return data.map(transformLeaveBalance);
    },
  });
}

export function useEmployeeLeaveBalance(employeeId: string, year?: number) {
  return useQuery({
    queryKey: ["leave-balances", "employee", employeeId, year],
    queryFn: async (): Promise<EmployeeLeaveBalance | null> => {
      if (!employeeId) return null;
      
      const queryParams = new URLSearchParams();
      if (year) queryParams.set("year", year.toString());
      
      const response = await apiClient.get<any>(
        `/leave-balances/employee/${employeeId}?${queryParams.toString()}`
      );
      const resData = response.data;
      const data = resData?.data || resData;
      
      if (!data) return null;
      
      return {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        year: data.year,
        balances: (data.balances || []).map(transformLeaveBalance),
      };
    },
    enabled: !!employeeId,
  });
}

export function useCreateLeaveBalance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateLeaveBalanceData): Promise<LeaveBalance> => {
      const response = await apiClient.post<any>("/leave-balances", data);
      const resData = response.data;
      return transformLeaveBalance(resData?.data || resData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      queryClient.invalidateQueries({ 
        queryKey: ["leave-balances", "employee", variables.employeeId] 
      });
      toast.success("Leave balance created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create leave balance", { description: error.message });
    },
  });
}

export function useBulkCreateLeaveBalances() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: BulkCreateLeaveBalanceData): Promise<LeaveBalance[]> => {
      const response = await apiClient.post<any>("/leave-balances/bulk", data);
      const resData = response.data;
      const dataArray = Array.isArray(resData?.data) 
        ? resData.data 
        : Array.isArray(resData) 
          ? resData 
          : [];
      return dataArray.map(transformLeaveBalance);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      queryClient.invalidateQueries({ 
        queryKey: ["leave-balances", "employee", variables.employeeId] 
      });
      toast.success("Leave balances created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create leave balances", { description: error.message });
    },
  });
}

export function useUpdateLeaveBalance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      data,
      employeeId 
    }: { 
      id: string; 
      data: UpdateLeaveBalanceData;
      employeeId: string;
    }): Promise<LeaveBalance> => {
      const response = await apiClient.put<any>(`/leave-balances/${id}`, data);
      const resData = response.data;
      return transformLeaveBalance(resData?.data || resData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      queryClient.invalidateQueries({ 
        queryKey: ["leave-balances", "employee", variables.employeeId] 
      });
      toast.success("Leave balance updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update leave balance", { description: error.message });
    },
  });
}

export function useDeleteLeaveBalance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      employeeId 
    }: { 
      id: string; 
      employeeId: string;
    }) => {
      await apiClient.delete(`/leave-balances/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      queryClient.invalidateQueries({ 
        queryKey: ["leave-balances", "employee", variables.employeeId] 
      });
      toast.success("Leave balance deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete leave balance", { description: error.message });
    },
  });
}
