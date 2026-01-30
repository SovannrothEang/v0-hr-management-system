import { create } from "zustand";

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "on_leave";
export type LeaveType = "annual" | "sick" | "personal" | "maternity" | "paternity" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: AttendanceStatus;
  workHours?: number;
  overtime?: number;
  notes?: string;
  // Additional fields for alignment with external API spec
  performBy?: string;
  performer?: {
    id: string;
    email: string;
    name: string;
  };
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  createdAt: string;
}

interface AttendanceState {
  selectedDate: Date;
  viewMode: "day" | "week" | "month";
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: "day" | "week" | "month") => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  selectedDate: new Date(),
  viewMode: "day",
  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
