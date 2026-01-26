/**
 * Role Constants and Permissions
 * Central definition for all roles and their permissions
 */

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  EMPLOYEE: 'employee',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

// Permission definitions
export const PERMISSIONS = {
  // Employee permissions
  EMPLOYEE_VIEW_ALL: 'employee:view:all',
  EMPLOYEE_VIEW_DEPARTMENT: 'employee:view:department',
  EMPLOYEE_VIEW_SELF: 'employee:view:self',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE_ALL: 'employee:update:all',
  EMPLOYEE_UPDATE_DEPARTMENT: 'employee:update:department',
  EMPLOYEE_DELETE_ALL: 'employee:delete:all',
  EMPLOYEE_DELETE_DEPARTMENT: 'employee:delete:department',

  // Attendance permissions
  ATTENDANCE_VIEW_ALL: 'attendance:view:all',
  ATTENDANCE_VIEW_DEPARTMENT: 'attendance:view:department',
  ATTENDANCE_VIEW_SELF: 'attendance:view:self',
  ATTENDANCE_MANAGE_ALL: 'attendance:manage:all',
  ATTENDANCE_MANAGE_DEPARTMENT: 'attendance:manage:department',
  ATTENDANCE_CLOCK_SELF: 'attendance:clock:self',

  // Leave request permissions
  LEAVE_VIEW_ALL: 'leave:view:all',
  LEAVE_VIEW_DEPARTMENT: 'leave:view:department',
  LEAVE_VIEW_SELF: 'leave:view:self',
  LEAVE_APPROVE: 'leave:approve',
  LEAVE_SUBMIT: 'leave:submit',

  // Payroll permissions
  PAYROLL_VIEW_ALL: 'payroll:view:all',
  PAYROLL_VIEW_DEPARTMENT: 'payroll:view:department',
  PAYROLL_VIEW_SELF: 'payroll:view:self',
  PAYROLL_GENERATE: 'payroll:generate',
  PAYROLL_PROCESS: 'payroll:process',
  PAYROLL_APPROVE: 'payroll:approve',

  // Reports permissions
  REPORTS_VIEW_ALL: 'reports:view:all',
  REPORTS_VIEW_DEPARTMENT: 'reports:view:department',
  REPORTS_GENERATE: 'reports:generate',

  // Settings permissions
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MODIFY: 'settings:modify',

  // System permissions
  AUDIT_VIEW: 'audit:view',
  ROLES_MANAGE: 'roles:manage',
} as const;

export type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<RoleName, PermissionName[]> = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    PERMISSIONS.EMPLOYEE_VIEW_ALL,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.EMPLOYEE_UPDATE_ALL,
    PERMISSIONS.EMPLOYEE_DELETE_ALL,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.ATTENDANCE_MANAGE_ALL,
    PERMISSIONS.ATTENDANCE_CLOCK_SELF,
    PERMISSIONS.LEAVE_VIEW_ALL,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_SUBMIT,
    PERMISSIONS.PAYROLL_VIEW_ALL,
    PERMISSIONS.PAYROLL_GENERATE,
    PERMISSIONS.PAYROLL_PROCESS,
    PERMISSIONS.PAYROLL_APPROVE,
    PERMISSIONS.REPORTS_VIEW_ALL,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MODIFY,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.ROLES_MANAGE,
  ],
  [ROLES.HR_MANAGER]: [
    // HR Manager has department-level permissions
    PERMISSIONS.EMPLOYEE_VIEW_DEPARTMENT,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.EMPLOYEE_UPDATE_DEPARTMENT,
    PERMISSIONS.EMPLOYEE_DELETE_DEPARTMENT,
    PERMISSIONS.ATTENDANCE_VIEW_DEPARTMENT,
    PERMISSIONS.ATTENDANCE_MANAGE_DEPARTMENT,
    PERMISSIONS.ATTENDANCE_CLOCK_SELF,
    PERMISSIONS.LEAVE_VIEW_DEPARTMENT,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_SUBMIT,
    PERMISSIONS.PAYROLL_VIEW_DEPARTMENT,
    PERMISSIONS.PAYROLL_GENERATE,
    PERMISSIONS.PAYROLL_PROCESS,
    PERMISSIONS.REPORTS_VIEW_DEPARTMENT,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  [ROLES.EMPLOYEE]: [
    // Employee has only self permissions
    PERMISSIONS.EMPLOYEE_VIEW_SELF,
    PERMISSIONS.ATTENDANCE_VIEW_SELF,
    PERMISSIONS.ATTENDANCE_CLOCK_SELF,
    PERMISSIONS.LEAVE_VIEW_SELF,
    PERMISSIONS.LEAVE_SUBMIT,
    PERMISSIONS.PAYROLL_VIEW_SELF,
  ],
};

// Route to required roles mapping
export const ROUTE_ROLES: Record<string, RoleName[]> = {
  // Employee routes
  '/api/employees': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/employees/[id]': [ROLES.ADMIN, ROLES.HR_MANAGER],

  // Payroll routes
  '/api/payroll': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/payroll/generate': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/payroll/process': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/payroll/mark-paid': [ROLES.ADMIN],
  '/api/payroll/summary': [ROLES.ADMIN, ROLES.HR_MANAGER],

  // Leave request routes
  '/api/leave-requests': [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
  '/api/leave-requests/[id]': [ROLES.ADMIN, ROLES.HR_MANAGER],

  // Reports routes
  '/api/reports/attendance': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/reports/employee': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/reports/payroll': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/reports/leave': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/reports/comprehensive': [ROLES.ADMIN, ROLES.HR_MANAGER],

  // Attendance routes - all roles can clock in/out
  '/api/attendance': [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
  '/api/attendance/clock-in': [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
  '/api/attendance/clock-out': [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.EMPLOYEE],

  // Dashboard routes - all authenticated users
  '/api/dashboard/stats': [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
  '/api/dashboard/attendance-trend': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/dashboard/department-distribution': [ROLES.ADMIN, ROLES.HR_MANAGER],
  '/api/dashboard/recent-activity': [ROLES.ADMIN, ROLES.HR_MANAGER],

  // Departments - read-only for all, modify admin only
  '/api/departments': [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.EMPLOYEE],
};

// Helper functions
export function hasRole(userRoles: RoleName[] | undefined, allowedRoles: RoleName[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function hasPermission(userRoles: RoleName[] | undefined, permission: PermissionName): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission) ?? false);
}

export function hasAnyPermission(userRoles: RoleName[] | undefined, permissions: PermissionName[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return permissions.some((permission) => hasPermission(userRoles, permission));
}

export function getAllowedRolesForRoute(pathname: string): RoleName[] | null {
  // Direct match
  if (ROUTE_ROLES[pathname]) {
    return ROUTE_ROLES[pathname];
  }

  // Try to match dynamic routes (e.g., /api/employees/123 matches /api/employees/[id])
  for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
    if (route.includes('[id]')) {
      const pattern = route.replace('[id]', '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(pathname)) {
        return roles;
      }
    }
  }

  return null;
}
