import { create } from "zustand";

export type PayrollStatus = "draft" | "processing" | "completed" | "paid";

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  overtime: number;
  bonus: number;
  deductions: number;
  tax: number;
  netSalary: number;
  status: PayrollStatus;
  paidAt?: string;
  createdAt: string;
}

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
  setSelectedPeriod: (period: string) => void;
  setFilterStatus: (status: PayrollStatus | "all") => void;
}

export const usePayrollStore = create<PayrollState>((set) => ({
  selectedPeriod: new Date().toISOString().slice(0, 7),
  filterStatus: "all",
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  setFilterStatus: (status) => set({ filterStatus: status }),
}));
