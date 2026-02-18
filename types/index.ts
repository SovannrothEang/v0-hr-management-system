export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "hr_manager" | "employee";
  avatar?: string;
  department?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: "active" | "inactive" | "on_leave";
  hireDate: string;
  salary: number;
  avatar?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
  };
  employmentType?: string;
  managerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  employeeCount: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: "present" | "absent" | "late" | "half_day" | "on_leave";
  workHours?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  employee?: Employee;
  type: "annual" | "sick" | "personal" | "unpaid" | "maternity" | "paternity";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employee?: Employee;
  period: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "pending" | "processed" | "paid";
  processedAt?: string;
  paidAt?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingRequests: number;
  totalPayroll: number;
  attendanceRate: number;
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
}

export interface DepartmentDistribution {
  name: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: "clock_in" | "clock_out" | "leave_request" | "payroll" | "new_employee";
  message: string;
  timestamp: string;
  employeeId?: string;
  employeeName?: string;
}

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

export interface PayrollApiResponse {
  data: PayrollRecord[];
  summary: PayrollSummary;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
}

export interface AttendanceFilters {
  date?: string;
  employeeId?: string;
  status?: string;
}

export interface LeaveRequestFilters {
  status?: string;
  type?: string;
  employeeId?: string;
}

export interface PayrollFilters {
  month?: string;
  year?: number;
  status?: string;
}
