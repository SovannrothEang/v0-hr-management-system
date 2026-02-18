import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { getChangedFields } from "@/lib/track-changes";
import type { PaginatedResponse } from "@/types/pagination";

export interface Department {
  id: string;
  name: string;
  employeeCount?: number;
  percentage?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Transform API department data to frontend interface
 */
function transformDepartment(dept: any): Department {
  if (typeof dept === 'string') {
    return {
      id: dept,
      name: dept,
      employeeCount: 0,
      percentage: 0,
    };
  }
  return {
    id: dept.id || dept.name,
    name: dept.name || dept.departmentName || dept.department_name || dept.title,
    employeeCount: Number(dept.employeeCount || dept.employee_count || dept.employees?.length || 0),
    percentage: dept.percentage !== undefined ? Number(dept.percentage) : 0,
    createdAt: dept.createdAt || dept.created_at,
    updatedAt: dept.updatedAt || dept.updated_at,
  };
}

export function useAllDepartments() {
  return useQuery({
    queryKey: ["departments", "all"],
    queryFn: async (): Promise<Department[]> => {
      const response = await apiClient.get<any>("/departments/all");
      const resData = response.data;
      const innerData = (resData as any).data || (Array.isArray(resData) ? resData : []);
      return innerData.map(transformDepartment);
    },
  });
}

export function useDepartments(params?: {
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: async (): Promise<PaginatedResponse<Department>> => {
      const queryParams = new URLSearchParams();
      // queryParams.set("includeEmployees", "true");
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());

      const response = await apiClient.get<any>(
        `/departments?${queryParams.toString()}`
      );

      const resData = response.data;

      // Robust extraction from ResultPagination structure
      const innerData = (resData as any).data || (Array.isArray(resData) ? resData : []);
      const transformedData = innerData.map(transformDepartment);

      // Handle ResultPagination flat properties
      const total = (resData as any).total ??
        (resData as any).meta?.total ??
        transformedData.length;

      const limit = (resData as any).limit ??
        (resData as any).meta?.limit ??
        params?.limit ?? 10;

      const page = (resData as any).page ??
        (resData as any).meta?.page ??
        params?.page ?? 1;

      const totalPages = (resData as any).totalPages ??
        (resData as any).meta?.totalPages ??
        Math.ceil(total / limit);

      return {
        data: transformedData,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNext: (resData as any).hasNext ?? (resData as any).meta?.hasNext ?? page < totalPages,
          hasPrevious: (resData as any).hasPrevious ?? (resData as any).meta?.hasPrevious ?? page > 1,
        },
      };
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }): Promise<Department> => {
      const response = await apiClient.post<Department | { data: Department }>("/departments", data);
      const resData = response.data;
      return (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create department", { description: error.message });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, original, modified }: { id: string; original: Department; modified: Partial<Department> }): Promise<Department> => {
      // Track only changed fields
      const changes = getChangedFields(original, modified);

      // Check if there are any changes
      if (Object.keys(changes).length === 0) {
        throw new Error("No changes detected");
      }

      // Use PATCH endpoint for partial updates
      const response = await apiClient.patch<Department | { data: Department }>(`/departments/${id}`, changes);
      const resData = response.data;
      return (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update department", { description: error.message });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete department", { description: error.message });
    },
  });
}
