import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PayrollRecord, PayrollSummary, PayrollApiResponse, ApiResponse } from "@/types";
import { toast } from "sonner";

const MONTH_MAP: Record<string, string> = {
  January: "1",
  February: "2",
  March: "3",
  April: "4",
  May: "5",
  June: "6",
  July: "7",
  August: "8",
  September: "9",
  October: "10",
  November: "11",
  December: "12",
};

export function usePayrollRecords(params?: {
  period?: string;
  status?: string;
  employeeId?: string;
}) {
  return useQuery({
    queryKey: ["payrolls", params],
    queryFn: async (): Promise<PayrollRecord[]> => {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.set("period", params.period);
      if (params?.status && params.status !== "all")
        queryParams.set("status", params.status);
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);

      const response = await apiClient.get<PayrollApiResponse>(
        `/payrolls?${queryParams.toString()}`
      );
      
      return response.data.data || [];
    },
  });
}

export function usePayroll(month: string, year: number) {
  return useQuery({
    queryKey: ["payrolls", month, year],
    queryFn: async (): Promise<PayrollApiResponse> => {
      const queryParams = new URLSearchParams();
      queryParams.set("month", MONTH_MAP[month] || month);
      queryParams.set("year", year.toString());

      const response = await apiClient.get<PayrollApiResponse>(
        `/payrolls?${queryParams.toString()}`
      );
      return response.data;
    },
  });
}



export function useGeneratePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ month, year }: { month: string; year: number }): Promise<PayrollRecord[]> => {
      const response = await apiClient.post<PayrollRecord[] | { data: PayrollRecord[] }>("/payrolls/generate", {
        month: MONTH_MAP[month] || month,
        year,
      });
      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls-summary"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to generate payroll", { description: error.message });
    },
  });
}

export function useProcessPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payrollId: string): Promise<PayrollRecord[]> => {
      const response = await apiClient.post<PayrollRecord[] | { data: PayrollRecord[] }>("/payrolls/process", {
        ids: [payrollId],
      });
      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls-summary"] });
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
    mutationFn: async (ids: string[]): Promise<PayrollRecord[]> => {
      const response = await apiClient.post<PayrollRecord[] | { data: PayrollRecord[] }>("/payrolls/mark-paid", {
        ids,
      });
      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls-summary"] });
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
    mutationFn: async (payrollId: string): Promise<PayrollRecord> => {
      const response = await apiClient.post<PayrollRecord | { data: PayrollRecord }>("/payrolls/mark-paid", {
        ids: [payrollId],
      });
      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls-summary"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to mark payroll as paid", {
        description: error.message,
      });
    },
  });
}
