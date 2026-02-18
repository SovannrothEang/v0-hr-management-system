import { create } from "zustand";

export type PayrollStatus = "pending" | "processed" | "paid";

export interface PayrollSummary {
  totalPayrolls: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalTax: number;
  totalOvertimePay: number;
  totalBonus: number;
  byStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  byDepartment: Array<{
    department: string;
    employeeCount: number;
    totalSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
  }>;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  };
  period: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  processedAt?: string;
  paidAt?: string;
}

interface PayrollState {
  selectedPeriod: string;
  filterStatus: PayrollStatus | "all";
  selectedPayrolls: string[];
  setSelectedPeriod: (period: string) => void;
  setFilterStatus: (status: PayrollStatus | "all") => void;
  togglePayroll: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

export const usePayrollStore = create<PayrollState>((set) => ({
  selectedPeriod: new Date().toISOString().slice(0, 7),
  filterStatus: "all",
  selectedPayrolls: [],
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  togglePayroll: (id) =>
    set((state) => ({
      selectedPayrolls: state.selectedPayrolls.includes(id)
        ? state.selectedPayrolls.filter((pid) => pid !== id)
        : [...state.selectedPayrolls, id],
    })),
  selectAll: (ids) => set({ selectedPayrolls: ids }),
  clearSelection: () => set({ selectedPayrolls: [] }),
}));
