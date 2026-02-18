import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { getChangedFields } from "@/lib/track-changes";
import type { PaginatedResponse } from "@/types/pagination";

export interface Position {
  id: string;
  title: string;
  description: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
  employeeCount: number;
  isActive: boolean;
  performBy?: string;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreatePositionData {
  title: string;
  description?: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
}

/**
 * Transform API position data to frontend interface
 */
function transformPosition(pos: any): Position {
  return {
    id: pos.id,
    title: pos.title || "",
    description: pos.description || "",
    salaryRangeMin: Number(pos.salaryRangeMin || 0),
    salaryRangeMax: Number(pos.salaryRangeMax || 0),
    employeeCount: Number(pos.employees?.length || pos.employeeCount || 0),
    isActive: pos.isActive ?? true,
    performBy: pos.performBy,
    createdAt: pos.createdAt,
    updatedAt: pos.updatedAt,
  };
}

export function usePositions(params?: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["positions", params],
    queryFn: async (): Promise<PaginatedResponse<Position>> => {
      const queryParams = new URLSearchParams();
      queryParams.set("childIncluded", "true");
      if (params?.search) queryParams.set("title", params.search);
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());
      if (params?.sortBy) queryParams.set("sortBy", params.sortBy);
      if (params?.sortOrder) queryParams.set("sortOrder", params.sortOrder);

      const response = await apiClient.get<any>(
        `/positions?${queryParams.toString()}`
      );

      const resData = response.data;

      // Robust extraction from ResultPagination structure
      const dataWrapper = (resData as any)?.data;
      const innerData = Array.isArray(dataWrapper?.data)
        ? dataWrapper.data
        : Array.isArray(dataWrapper)
          ? dataWrapper
          : Array.isArray(resData)
            ? resData
            : [];
      const transformedData = innerData.map(transformPosition);

      const metaWrapper = dataWrapper?.meta ?? (resData as any).meta ?? {};

      // Handle ResultPagination flat properties
      const total = (resData as any).total ??
        metaWrapper.total ??
        transformedData.length;

      const limit = (resData as any).limit ??
        metaWrapper.limit ??
        params?.limit ?? 10;

      const page = (resData as any).page ??
        metaWrapper.page ??
        params?.page ?? 1;

      const totalPages = (resData as any).totalPages ??
        metaWrapper.totalPages ??
        Math.ceil(total / limit);

      return {
        data: transformedData,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNext: (resData as any).hasNext ?? metaWrapper.hasNext ?? page < totalPages,
          hasPrevious: (resData as any).hasPrevious ?? metaWrapper.hasPrevious ?? page > 1,
        },
      };
    },
  });
}

export function useAllPositions() {
  return useQuery({
    queryKey: ["positions", "all"],
    queryFn: async (): Promise<Position[]> => {
      const response = await apiClient.get<any>("/positions?limit=100");
      const resData = response.data;
      const dataWrapper = (resData as any)?.data;
      const innerData = Array.isArray(dataWrapper?.data)
        ? dataWrapper.data
        : Array.isArray(dataWrapper)
          ? dataWrapper
          : Array.isArray(resData)
            ? resData
            : [];
      return innerData.map(transformPosition);
    },
  });
}

export function usePosition(id: string | null) {
  return useQuery({
    queryKey: ["position", id],
    queryFn: async (): Promise<Position | null> => {
      if (!id) return null;
      const response = await apiClient.get<any>(`/positions/${id}?childIncluded=true`);
      const resData = response.data;
      const data = (resData && typeof resData === "object" && "data" in resData) ? (resData as any).data : resData;
      return data ? transformPosition(data) : null;
    },
    enabled: !!id,
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePositionData): Promise<Position> => {
      const response = await apiClient.post<any>("/positions", data);
      const resData = response.data;
      const result = (resData && typeof resData === "object" && "data" in resData) ? (resData as any).data : resData;
      return transformPosition(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Position created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create position", { description: error.message });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, original, modified }: {
      id: string;
      original: Position;
      modified: Partial<Position>;
    }): Promise<Position> => {
      const changes = getChangedFields(original, modified);

      if (Object.keys(changes).length === 0) {
        throw new Error("No changes detected");
      }

      // External API uses PUT (returns 204 No Content)
      const response = await apiClient.put<any>(`/positions/${id}`, changes);
      const resData = response.data;

      // PUT returns 204 (no body), merge locally
      if (!resData) {
        return { ...original, ...modified } as Position;
      }

      const result = (resData && typeof resData === "object" && "data" in resData) ? (resData as any).data : resData;
      return transformPosition(result);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["position", variables.id] });
      toast.success("Position updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update position", { description: error.message });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Position deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete position", { description: error.message });
    },
  });
}
