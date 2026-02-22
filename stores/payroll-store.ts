import { create } from "zustand";
import type { PayrollSummary } from "@/types";

export type PayrollStatus = "pending" | "processed" | "paid";

export type { PayrollSummary } from "@/types";

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
