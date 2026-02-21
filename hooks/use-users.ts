import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/stores/user-store";
import type { PaginatedResponse, PaginationMeta } from "@/types/pagination";
import { toast } from "sonner";
import { getChangedFields } from "@/lib/track-changes";
import { ROLES, type RoleName } from "@/lib/constants/roles";
import { getUserAvatarUrl } from "@/hooks/use-employees";

/**
 * Transform API user data to frontend interface
 */
function transformUser(user: any): User {
  if (!user) return {} as User;

  // Handle role mapping: ensure it's an array of RoleName
  let roles: RoleName[] = [];
  if (Array.isArray(user.roles)) {
    roles = user.roles.filter((role: string): role is RoleName =>
      Object.values(ROLES).includes(role as RoleName)
    );
  } else if (user.role) {
    // Single role string
    const role = user.role;
    if (Object.values(ROLES).includes(role as RoleName)) {
      roles = [role as RoleName];
    }
  }

  // Extract employee details if available
  const employee = user.employees || user.employee;
  const profileImage = user.profileImage || user.avatar || employee?.profileImage || employee?.avatar;
  const employeeObj = employee ? {
    emergencyContact: employee.emergencyContact || undefined,
    bankDetails: employee.bankDetails || undefined,
    phoneNumber: employee.phoneNumber || employee.phone || undefined,
    address: employee.address || undefined,
    employeeCode: employee.employeeCode || undefined,
    department: employee.department ? {
      id: employee.department.id,
      name: employee.department.name || employee.department.departmentName || ""
    } : undefined,
    position: employee.position ? {
      id: employee.position.id,
      name: employee.position.name || employee.position.positionName || ""
    } : undefined,
  } : undefined;

  return {
    id: user.id,
    email: user.email,
    username: user.username || user.email, // Use email as fallback for username
    firstName: user.firstname || user.firstName || employee?.firstname || "",
    lastName: user.lastname || user.lastName || employee?.lastname || "",
    avatar: getUserAvatarUrl(user.id, profileImage),
    roles,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    employee: employeeObj,
  };
}

export function useUsers(params?: {
  search?: string;
  role?: RoleName | "all";
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async (): Promise<PaginatedResponse<User>> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.set("search", params.search);
      if (params?.role && params.role !== "all")
        queryParams.set("role", params.role);
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());

      const response = await apiClient.get<{ data: any[], meta?: any, total?: number, page?: number, limit?: number, totalPages?: number, hasNext?: boolean, hasPrevious?: boolean }>(
        `/users?${queryParams.toString()}`
      );

      const resData = response.data;

      // Robust extraction from ResultPagination structure
      const innerData = (resData as any).data || (Array.isArray(resData) ? resData : []);
      const transformedData = innerData.map(transformUser);

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

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async (): Promise<User | null> => {
      if (!id) return null;
      const response = await apiClient.get<any>(`/users/${id}`);
      const resData = response.data;
      const data = (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
      return data ? transformUser(data) : null;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<User>): Promise<User> => {
      const response = await apiClient.post<any>("/users", data);
      const resData = response.data;
      const result = (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
      return transformUser(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create user", { description: error.message });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, original, modified }: { id: string; original: User; modified: Partial<User> }): Promise<User> => {
      // Track only changed fields
      const changes = getChangedFields(original, modified);

      // Check if there are any changes
      if (Object.keys(changes).length === 0) {
        throw new Error("No changes detected");
      }

      // Use PATCH endpoint for partial updates
      const response = await apiClient.patch<any>(`/users/${id}`, changes);
      const resData = response.data;
      const result = (resData && typeof resData === 'object' && 'data' in resData) ? (resData as any).data : resData;
      
      // If server returns no data (204 or void response), return merged original with changes
      if (!result) {
        return { ...original, ...modified } as User;
      }

      return transformUser(result);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update user", { description: error.message });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete user", { description: error.message });
    },
  });
}

export function useUploadUserImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.postFormData<{ imagePath: string }>(
        `/users/${id}/image`,
        formData
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["session"] }); // Session user might have changed avatar
    },
    onError: (error: Error) => {
      toast.error("Failed to upload image", { description: error.message });
    },
  });
}

export function useRemoveUserImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/${id}/image`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Image removed successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove image", { description: error.message });
    },
  });
}
