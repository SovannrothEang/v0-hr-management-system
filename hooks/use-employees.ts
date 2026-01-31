import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Employee } from "@/stores/employee-store";
import { toast } from "sonner";
import { getChangedFields } from "@/lib/track-changes";

export function useEmployees(params?: {
  search?: string;
  department?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.set("search", params.search);
      if (params?.department && params.department !== "all")
        queryParams.set("department", params.department);
      if (params?.status && params.status !== "all")
        queryParams.set("status", params.status);

      const response = await apiClient.get<{ data: Employee[]; meta: any } | Employee[]>(
        `/employees?${queryParams.toString()}`
      );

      // Handle both internal API (array) and external API (object with data array)
      const data = Array.isArray(response.data) ? response.data : (response.data as any).data || [];

      // Transform external API data to match frontend interface
      return data.map((emp: any) => ({
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
      }));
    },
  });
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<Employee>(`/employees/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      const response = await apiClient.post<Employee>("/employees", data);
      return response.data;
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
    mutationFn: async ({ id, original, modified }: { id: string; original: Employee; modified: Partial<Employee> }) => {
      // Track only changed fields
      const changes = getChangedFields(original, modified);

      // Check if there are any changes
      if (Object.keys(changes).length === 0) {
        throw new Error("No changes detected");
      }

      // Use PATCH endpoint for partial updates
      const response = await apiClient.patch<Employee>(`/employees/${id}`, changes);
      return response.data;
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

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await apiClient.get<string[] | { id: string; name: string }[]>("/departments");
      // Handle both internal API (string[]) and external API (object[])
      const data = response.data;
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
        return data as string[];
      }
      // Transform external API objects to department names
      return (data as { id: string; name: string }[]).map((dept) => dept.name);
    },
  });
}
