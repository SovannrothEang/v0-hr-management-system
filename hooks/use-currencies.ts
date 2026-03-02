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
      try {
        const response = await apiClient.get<any>("/currencies?limit=100");
        console.log("[useCurrencies] Full response:", response);
        
        // The response structure from proxy is: { data: { data: [...], meta: {...} } }
        // Where response.data is the paginated result
        const paginatedData = response.data;
        
        if (!paginatedData) {
          console.warn("[useCurrencies] No response data");
          return [];
        }
        
        console.log("[useCurrencies] Paginated data:", paginatedData);
        
        // Extract the currencies array from paginated data
        // Structure: { data: [...], meta: {...} }
        const currenciesArray = paginatedData.data;
        
        if (!Array.isArray(currenciesArray)) {
          console.warn("[useCurrencies] Currencies data is not an array:", currenciesArray);
          return [];
        }
        
        console.log("[useCurrencies] Currencies array:", currenciesArray);
        return currenciesArray.filter((c: Currency) => c.isActive !== false);
      } catch (error) {
        console.error("[useCurrencies] Error fetching currencies:", error);
        return [];
      }
    },
    staleTime: 0, // Disable stale time to always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
