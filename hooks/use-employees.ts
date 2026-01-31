import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Employee } from "@/stores/employee-store";
import type { PaginatedResponse, PaginationMeta } from "@/types/pagination";
import { toast } from "sonner";
import { getChangedFields } from "@/lib/track-changes";

/**
 * Transform API employee data to frontend interface
 */
function transformEmployee(emp: any): Employee {
  return {
    id: emp.id,
    employeeId: emp.employeeCode || emp.employeeId,
    firstName: emp.firstname || emp.firstName,
    lastName: emp.lastname || emp.lastName,
    email: emp.user?.email || emp.email,
    phone: emp.phoneNumber || emp.phone || '',
    avatar: emp.avatar,
    department: emp.department?.name || emp.department || '',
    position: emp.position?.title || emp.position || '',
    employmentType: emp.employmentType?.toLowerCase() || emp.employmentType,
    status: emp.status?.toLowerCase() || emp.status,
    hireDate: emp.hireDate || emp.createdAt,
    salary: emp.salary || 0,
    managerId: emp.managerId,
    address: emp.address,
    emergencyContact: emp.emergencyContact,
    bankDetails: emp.bankDetails,
    gender: emp.gender,
    dateOfBirth: emp.dateOfBirth,
    userId: emp.user?.id || emp.userId,
    positionId: emp.position?.id || emp.positionId,
    departmentId: emp.department?.id || emp.departmentId,
    isActive: emp.isActive ?? true,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  };
}

export function useEmployees(params?: {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: async (): Promise<PaginatedResponse<Employee>> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.set("search", params.search);
      if (params?.department && params.department !== "all")
        queryParams.set("department", params.department);
      if (params?.status && params.status !== "all")
        queryParams.set("status", params.status);
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());

      const response = await apiClient.get<{ data: any[], meta: PaginationMeta }>(
        `/employees?${queryParams.toString()}`
      );

      const resData = response.data;

      // Handle both internal API (array) and external API (paginated response)
      if (Array.isArray(resData)) {
        // Legacy array response - wrap in paginated structure
        const data = resData.map(transformEmployee);
        const total = data.length;
        const limit = params?.limit || 10;
        const totalPages = Math.ceil(total / limit);
        const page = params?.page || 1;

        return {
          data,
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
      return {
        data: resData.data.map(transformEmployee),
        meta: resData.meta,
      };
    },
  });
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async (): Promise<Employee | null> => {
      if (!id) return null;
      const response = await apiClient.get<Employee | { data: Employee }>(`/employees/${id}`);
      const resData = response.data;
      return (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Employee>): Promise<Employee> => {
      const response = await apiClient.post<Employee | { data: Employee }>("/employees", data);
      const resData = response.data;
      return (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create employee", { description: error.message });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, original, modified }: { id: string; original: Employee; modified: Partial<Employee> }): Promise<Employee> => {
      // Track only changed fields
      const changes = getChangedFields(original, modified);

      // Check if there are any changes
      if (Object.keys(changes).length === 0) {
        throw new Error("No changes detected");
      }

      // Use PATCH endpoint for partial updates
      const response = await apiClient.patch<Employee | { data: Employee }>(`/employees/${id}`, changes);
      const resData = response.data;
      return (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
      toast.success("Employee updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update employee", { description: error.message });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete employee", { description: error.message });
    },
  });
}


