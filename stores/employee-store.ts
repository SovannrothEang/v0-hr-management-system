import { create } from "zustand";

export type EmploymentStatus = "active" | "on_leave" | "terminated" | "probation";
export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  department: string;
  position: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  hireDate: string;
  salary: number;
  managerId?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface EmployeeState {
  selectedEmployee: Employee | null;
  searchQuery: string;
  filterDepartment: string;
  filterStatus: EmploymentStatus | "all";
  setSelectedEmployee: (employee: Employee | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterDepartment: (department: string) => void;
  setFilterStatus: (status: EmploymentStatus | "all") => void;
  clearFilters: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  selectedEmployee: null,
  searchQuery: "",
  filterDepartment: "all",
  filterStatus: "all",
  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterDepartment: (department) => set({ filterDepartment: department }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  clearFilters: () =>
    set({ searchQuery: "", filterDepartment: "all", filterStatus: "all" }),
}));
