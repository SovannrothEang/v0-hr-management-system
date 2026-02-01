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

export function useDepartments(params?: {
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: async (): Promise<PaginatedResponse<Department>> => {
      const queryParams = new URLSearchParams();
      queryParams.set("childIncluded", "true");
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());

      const response = await apiClient.get<Department[] | PaginatedResponse<Department>>(
        `/departments?${queryParams.toString()}`
      );

      const data = response.data;

      // Handle both internal API (array) and external API (paginated response)
      if (Array.isArray(data)) {
        // Legacy array response - wrap in paginated structure
        const transformedData = data.map(transformDepartment);
        const total = transformedData.length;
        const limit = params?.limit || 10;
        const totalPages = Math.ceil(total / limit);
        const page = params?.page || 1;

        return {
          data: transformedData,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
          },
        };
      }

      // Paginated response from external API
      if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
        const paginatedData = data as PaginatedResponse<any>;
        const transformedData = paginatedData.data.map(transformDepartment);
        const meta = paginatedData.meta || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: transformedData.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Ensure all meta fields are present and correct
        const total = meta.total ?? transformedData.length;
        const metaLimit = meta.limit ?? params?.limit ?? 10;
        const totalPages = meta.totalPages ?? Math.ceil(total / metaLimit);
        const page = meta.page ?? params?.page ?? 1;

        return {
          data: transformedData,
          meta: {
            ...meta,
            page,
            limit: metaLimit,
            total,
            totalPages,
            hasNext: meta.hasNext ?? page < totalPages,
            hasPrevious: meta.hasPrevious ?? page > 1,
          },
        };
      }

      // Fallback for unexpected response
      return {
        data: [],
        meta: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
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
