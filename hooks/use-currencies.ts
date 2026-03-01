import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  country: string;
  isActive: boolean;
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: async (): Promise<Currency[]> => {
      const response = await apiClient.get<{ success: boolean; data: { data: Currency[] } }>(
        "/currencies?limit=100"
      );
      const resData = response.data;
      if (resData && typeof resData === "object" && "data" in resData && resData.success) {
        const data = resData.data?.data || resData.data || [];
        return data.filter((c: Currency) => c.isActive !== false);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
