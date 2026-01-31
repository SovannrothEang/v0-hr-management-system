import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { getChangedFields } from "@/lib/track-changes";

export interface Department {
  id: string;
  name: string;
  employeeCount?: number;
  percentage?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await apiClient.get<Department[] | { id: string; name: string }[]>("/departments?childIncluded=true");

      // Handle both internal API (array of strings) and external API (array of objects)
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        // If it's an array of strings, convert to Department objects
        if (typeof data[0] === 'string') {
          return (data as unknown as string[]).map((name) => ({
            id: name,
            name,
            employeeCount: 0,
            percentage: 0,
          }));
        }

        // If it's an array of objects, transform to Department interface
        return (data as any[]).map((dept) => ({
          id: dept.id || dept.name,
          name: dept.name || dept.departmentName || dept.title,
          employeeCount: dept.employeeCount || dept.employees?.length || 0,
          percentage: dept.percentage || 0,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt,
        }));
      }

      return [];
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiClient.post<Department>("/departments", data);
      return response.data;
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
    mutationFn: async ({ id, original, modified }: { id: string; original: Department; modified: Partial<Department> }) => {
      // Track only changed fields
      const changes = getChangedFields(original, modified);

      // Check if there are any changes
      if (Object.keys(changes).length === 0) {
        throw new Error("No changes detected");
      }

      const response = await apiClient.put<Department>(`/departments?id=${id}`, changes);
      return response.data;
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
      await apiClient.delete(`/departments?id=${id}`);
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
