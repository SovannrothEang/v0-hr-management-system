import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface TaxBracket {
  id: string;
  currencyCode: string;
  countryCode: string;
  taxYear: number;
  bracketName: string;
  minAmount: number;
  maxAmount: number;
  taxRate: number;
  fixedAmount: number;
  isActive: boolean;
}

export interface CreateTaxBracketDto {
  currencyCode: string;
  countryCode: string;
  taxYear: number;
  bracketName: string;
  minAmount: number;
  maxAmount: number;
  taxRate: number;
  fixedAmount: number;
}

interface TaxBracketResponse {
  data: TaxBracket[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function useTaxBrackets(params?: {
  page?: number;
  limit?: number;
  taxYear?: number;
  currencyCode?: string;
  countryCode?: string;
}) {
  return useQuery({
    queryKey: ["tax-brackets", params],
    queryFn: async (): Promise<TaxBracketResponse> => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());
      if (params?.taxYear) queryParams.set("taxYear", params.taxYear.toString());
      if (params?.currencyCode) queryParams.set("currencyCode", params.currencyCode);
      if (params?.countryCode) queryParams.set("countryCode", params.countryCode);

      const response = await apiClient.get<TaxBracketResponse>(
        `/tax-brackets?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrevious: false },
      };
    },
    staleTime: 0,
  });
}

export function useCreateTaxBracket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTaxBracketDto): Promise<TaxBracket> => {
      const response = await apiClient.post<TaxBracket>(
        "/tax-brackets",
        dto
      );
      
      if (!response.success) {
        throw new Error("Failed to create tax bracket");
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast.success("Tax bracket created successfully");
      queryClient.invalidateQueries({ queryKey: ["tax-brackets"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create tax bracket");
    },
  });
}

export function useDeleteTaxBracket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/tax-brackets/${id}`);
    },
    onSuccess: () => {
      toast.success("Tax bracket deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tax-brackets"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete tax bracket");
    },
  });
}
