import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PayrollRecord, PayrollSummary } from "@/types";
import { toast } from "sonner";

export function usePayrollRecords(params?: {
  period?: string;
  status?: string;
  employeeId?: string;
}) {
  return useQuery({
    queryKey: ["payroll", params],
    queryFn: async (): Promise<PayrollRecord[]> => {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.set("period", params.period);
      if (params?.status && params.status !== "all")
        queryParams.set("status", params.status);
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);

      const response = await apiClient.get<PayrollRecord[] | { data: PayrollRecord[] }>(
        `/payroll?${queryParams.toString()}`
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

export function usePayroll(month: string, year: number) {
  return useQuery({
    queryKey: ["payroll", month, year],
    queryFn: async (): Promise<PayrollRecord[]> => {
      const queryParams = new URLSearchParams();
      queryParams.set("month", month);
      queryParams.set("year", year.toString());

      const response = await apiClient.get<PayrollRecord[] | { data: PayrollRecord[] }>(
        `/payroll?${queryParams.toString()}`
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

export function usePayrollSummary(period?: string) {
  return useQuery({
    queryKey: ["payroll-summary", period],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (period) queryParams.set("period", period);

      const response = await apiClient.get<PayrollSummary>(
        `/payroll/summary?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ month, year }: { month: string; year: number }) => {
      const response = await apiClient.post<PayrollRecord[]>("/payroll/generate", {
        month,
        year,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to generate payroll", { description: error.message });
    },
  });
}

export function useProcessPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payrollId: string) => {
      const response = await apiClient.post<PayrollRecord[]>("/payroll/process", {
        ids: [payrollId],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      toast.success("Payroll processed successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to process payroll", { description: error.message });
    },
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiClient.post<PayrollRecord[]>("/payroll/mark-paid", {
        ids,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to mark payroll as paid", {
        description: error.message,
      });
    },
  });
}

export function useMarkPayrollPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payrollId: string) => {
      const response = await apiClient.post<PayrollRecord>("/payroll/mark-paid", {
        ids: [payrollId],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to mark payroll as paid", {
        description: error.message,
      });
    },
  });
}
