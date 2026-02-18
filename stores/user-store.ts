import { create } from "zustand";
import { ROLES, type RoleName } from "@/lib/constants/roles";

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: RoleName[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: {
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    bankDetails?: {
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    };
    phoneNumber?: string;
    address?: string;
    employeeCode?: string;
    department?: {
      id: string;
      name: string;
    };
    position?: {
      id: string;
      name: string;
    };
  };
}

interface UserState {
  selectedUser: User | null;
  searchQuery: string;
  filterRole: RoleName | "all";
  setSelectedUser: (user: User | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterRole: (role: RoleName | "all") => void;
  clearFilters: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  selectedUser: null,
  searchQuery: "",
  filterRole: "all",
  setSelectedUser: (user) => set({ selectedUser: user }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterRole: (role) => set({ filterRole: role }),
  clearFilters: () =>
    set({ searchQuery: "", filterRole: "all" }),
}));