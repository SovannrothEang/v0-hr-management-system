import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PayrollRecord, PayrollSummary } from "@/types";
import { toast } from "sonner";

export interface PayrollQueryParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: string;
  year?: number;
  month?: number;
  sortBy?: "payPeriodStart" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface PayrollListResponse {
  data: PayrollRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  summary?: PayrollSummary;
}

export function usePayrollRecords(params?: PayrollQueryParams) {
  return useQuery({
    queryKey: ["payrolls", params],
    queryFn: async (): Promise<PayrollListResponse> => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());
      if (params?.employeeId) queryParams.set("employeeId", params.employeeId);
      if (params?.status && params.status !== "all") {
        queryParams.set("status", params.status.toUpperCase());
      }
      if (params?.year) queryParams.set("year", params.year.toString());
      if (params?.month) queryParams.set("month", params.month.toString());
      if (params?.sortBy) queryParams.set("sortBy", params.sortBy);
      if (params?.sortOrder) queryParams.set("sortOrder", params.sortOrder);

      const response = await apiClient.get<{ success: boolean; data: PayrollListResponse }>(
        `/payrolls?${queryParams.toString()}`
      );
      const resData = response.data;
      if (resData && typeof resData === "object" && "data" in resData && "success" in resData) {
        return (resData as any).data as PayrollListResponse;
      }
      return resData as PayrollListResponse;
    },
  });
}

export interface PayrollSummaryParams {
  year?: number;
  month?: number;
  departmentId?: string;
}

export function usePayrollSummary(params?: PayrollSummaryParams) {
  return useQuery({
    queryKey: ["payrolls-summary", params],
    queryFn: async (): Promise<PayrollSummary> => {
      const queryParams = new URLSearchParams();
      if (params?.year) queryParams.set("year", params.year.toString());
      if (params?.month) queryParams.set("month", params.month.toString());
      if (params?.departmentId) queryParams.set("departmentId", params.departmentId);

      const response = await apiClient.get<{ success: boolean; data: PayrollSummary }>(
        `/payrolls/summary?${queryParams.toString()}`
      );
      const resData = response.data;
      if (resData && typeof resData === "object" && "data" in resData && "success" in resData) {
        return (resData as any).data as PayrollSummary;
      }
      return resData as PayrollSummary;
    },
  });
}

export interface GeneratePayrollParams {
  payPeriodStart: string;
  payPeriodEnd: string;
  currencyCode: string;
  departmentId?: string;
  employeeIds?: string[];
}

export interface GeneratePayrollResult {
  totalGenerated: number;
  totalSkipped: number;
  totalFailed: number;
  generatedPayrollIds: string[];
  skippedEmployees: Array<{
    employeeId: string;
    employeeName: string;
    reason: string;
  }>;
  failedEmployees: Array<{
    employeeId: string;
    employeeName: string;
    error: string;
  }>;
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GeneratePayrollParams): Promise<GeneratePayrollResult> => {
      const response = await apiClient.post<GeneratePayrollResult>(
        "/payrolls/generate",
        params
      );
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls-summary"] });
      toast.success(`Payroll generated`, {
        description: `${result.totalGenerated} payroll(s) created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to generate payroll", { description: error.message });
    },
  });
}

export function useFinalizePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payrollId: string): Promise<PayrollRecord> => {
      const response = await apiClient.patch<PayrollRecord>(
        `/payrolls/${payrollId}/finalize`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls-summary"] });
      toast.success("Payroll finalized successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to finalize payroll", { description: error.message });
    },
  });
}

export interface CreateDraftPayrollParams {
  employeeId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  currencyCode: string;
  overtimeHours?: number;
  bonus?: number;
  deductions?: number;
  basicSalaryOverride?: number;
}

export function useCreateDraftPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateDraftPayrollParams): Promise<PayrollRecord> => {
      const response = await apiClient.post<PayrollRecord>("/payrolls/process", params);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls-summary"] });
      toast.success("Draft payroll created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create draft payroll", { description: error.message });
    },
  });
}

export interface MarkPaidParams {
  payrollId: string;
  paymentDate?: string;
}

export function useMarkPayrollPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payrollId, paymentDate }: MarkPaidParams): Promise<PayrollRecord> => {
      const response = await apiClient.patch<PayrollRecord>(
        `/payrolls/${payrollId}/mark-paid`,
        paymentDate ? { paymentDate } : {}
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls-summary"] });
      toast.success("Payroll marked as paid");
    },
    onError: (error: Error) => {
      toast.error("Failed to mark payroll as paid", {
        description: error.message,
      });
    },
  });
}

export function useDeletePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payrollId: string): Promise<void> => {
      await apiClient.delete(`/payrolls/${payrollId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrolls-summary"] });
      toast.success("Payroll deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete payroll", {
        description: error.message,
      });
    },
  });
}

export function usePayrollById(payrollId: string | null) {
  return useQuery({
    queryKey: ["payroll", payrollId],
    queryFn: async (): Promise<PayrollRecord> => {
      if (!payrollId) throw new Error("No payroll ID provided");
      const response = await apiClient.get<PayrollRecord>(
        `/payrolls/${payrollId}`
      );
      if (!response.data) {
        throw new Error("Payroll not found");
      }
      return response.data;
    },
    enabled: !!payrollId,
  });
}

export function useDownloadPayslip() {
  return useMutation({
    mutationFn: async (payrollId: string): Promise<{ blob: Blob; filename: string }> => {
      const response = await fetch(`/api/payrolls/payslip/${payrollId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download payslip");
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `payslip-${payrollId}.pdf`;

      const blob = await response.blob();
      return { blob, filename };
    },
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Payslip downloaded");
    },
    onError: (error: Error) => {
      toast.error("Failed to download payslip", {
        description: error.message,
      });
    },
  });
}

export const useProcessPayroll = useFinalizePayroll;

export const useMarkAsPaid = useMarkPayrollPaid;

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

export { MONTH_MAP };

export function usePayroll(month: string | number, year: number) {
  const monthNum =
    typeof month === "string"
      ? MONTH_MAP[month]
        ? parseInt(MONTH_MAP[month])
        : parseInt(month)
      : month;

  const { data: recordsData, isLoading: recordsLoading } = usePayrollRecords({
    month: monthNum,
    year,
  });

  const { data: summary, isLoading: summaryLoading } = usePayrollSummary({
    month: monthNum,
    year,
  });

  return {
    data: {
      data: recordsData?.data || [],
      summary,
      meta: recordsData?.meta,
    },
    isLoading: recordsLoading || summaryLoading,
  };
}
