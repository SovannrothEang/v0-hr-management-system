import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface ExchangeRate {
  id: string;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: number;
  date: string;
  createdAt: string;
}

export interface CreateExchangeRateDto {
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: number;
  date: string;
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ["exchange-rates"],
    queryFn: async (): Promise<ExchangeRate[]> => {
      const response = await apiClient.get<ExchangeRate[]>("/exchange-rates");
      return response.data || [];
    },
  });
}

export function useSaveExchangeRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateExchangeRateDto): Promise<ExchangeRate> => {
      const response = await apiClient.post<ExchangeRate>("/exchange-rates", dto);
      if (!response.success) {
        throw new Error(response.message || "Failed to save exchange rate");
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Exchange rate saved successfully");
      queryClient.invalidateQueries({ queryKey: ["exchange-rates"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save exchange rate");
    },
  });
}
