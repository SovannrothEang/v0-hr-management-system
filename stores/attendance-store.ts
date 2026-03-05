import { create } from "zustand";
import { subDays, startOfDay } from "date-fns";

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "on_leave" | "excused" | "early_out" | "overtime" | "did_not_checkout";
export type LeaveType = "annual" | "sick" | "personal" | "maternity" | "paternity" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface AttendanceSummary {
  daysPresent: number;
  lateCount: number;
  daysAbsent: number;
  daysOnLeave: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
}

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
    avatar?: string;
    profileImage?: string;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  employee?: any;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface LeaveRequestSummary {
  total_requests: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
}

interface AttendanceState {
  selectedDate: Date;
  dateFrom: Date;
  dateTo: Date;
  viewMode: "day" | "week" | "month";
  setSelectedDate: (date: Date) => void;
  setDateFrom: (date: Date) => void;
  setDateTo: (date: Date) => void;
  setViewMode: (mode: "day" | "week" | "month") => void;
}

const getYesterday = () => subDays(startOfDay(new Date()), 1);
const getToday = () => startOfDay(new Date());

export const useAttendanceStore = create<AttendanceState>((set) => ({
  selectedDate: getToday(),
  dateFrom: getYesterday(),
  dateTo: getToday(),
  viewMode: "day",
  setSelectedDate: (date) => set({ selectedDate: date }),
  setDateFrom: (date) => set({ dateFrom: date }),
  setDateTo: (date) => set({ dateTo: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
