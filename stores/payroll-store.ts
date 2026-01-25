import { create } from "zustand";

export type PayrollStatus = "pending" | "processed" | "paid";

export interface PayrollSummary {
  totalPayroll: number;
  totalEmployees: number;
  totalOvertimePaid: number;
  totalBonuses: number;
  totalDeductions: number;
  averageSalary: number;
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
