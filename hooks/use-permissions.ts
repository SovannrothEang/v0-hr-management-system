/**
 * usePermissions Hook
 * Provides role-based permission checks for UI components
 */

import { useSessionStore } from '@/stores/session';
import { ROLES, PERMISSIONS, hasRole, hasPermission, hasAnyPermission } from '@/lib/constants/roles';
import type { RoleName, PermissionName } from '@/lib/constants/roles';

export function usePermissions() {
  const { user } = useSessionStore();
  const userRole = user?.role as RoleName | undefined;

  return {
    // User info
    user,
    role: userRole,
    
    // Role checks
    isAdmin: userRole === ROLES.ADMIN,
    isHRManager: userRole === ROLES.HR_MANAGER,
    isEmployee: userRole === ROLES.EMPLOYEE,
    
    // Combined role checks
    isAdminOrHR: userRole === ROLES.ADMIN || userRole === ROLES.HR_MANAGER,
    
    // Generic role check
    hasRole: (allowedRoles: RoleName[]) => hasRole(userRole, allowedRoles),
    
    // Permission checks
    hasPermission: (permission: PermissionName) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: PermissionName[]) => hasAnyPermission(userRole, permissions),
    
    // Feature flags based on roles
    can: {
      // Employee permissions
      viewAllEmployees: hasPermission(userRole, PERMISSIONS.EMPLOYEE_VIEW_ALL),
      createEmployee: hasPermission(userRole, PERMISSIONS.EMPLOYEE_CREATE),
      updateEmployee: hasPermission(userRole, PERMISSIONS.EMPLOYEE_UPDATE_ALL) || 
                      hasPermission(userRole, PERMISSIONS.EMPLOYEE_UPDATE_DEPARTMENT),
      deleteEmployee: hasPermission(userRole, PERMISSIONS.EMPLOYEE_DELETE_ALL) || 
                      hasPermission(userRole, PERMISSIONS.EMPLOYEE_DELETE_DEPARTMENT),
      
      // Payroll permissions
      viewPayroll: hasPermission(userRole, PERMISSIONS.PAYROLL_VIEW_ALL) || 
                   hasPermission(userRole, PERMISSIONS.PAYROLL_VIEW_DEPARTMENT),
      generatePayroll: hasPermission(userRole, PERMISSIONS.PAYROLL_GENERATE),
      processPayroll: hasPermission(userRole, PERMISSIONS.PAYROLL_PROCESS),
      approvePayroll: hasPermission(userRole, PERMISSIONS.PAYROLL_APPROVE),
      
      // Leave permissions
      viewAllLeaveRequests: hasPermission(userRole, PERMISSIONS.LEAVE_VIEW_ALL) || 
                            hasPermission(userRole, PERMISSIONS.LEAVE_VIEW_DEPARTMENT),
      approveLeaveRequest: hasPermission(userRole, PERMISSIONS.LEAVE_APPROVE),
      submitLeaveRequest: hasPermission(userRole, PERMISSIONS.LEAVE_SUBMIT),
      
      // Reports permissions
      viewReports: hasPermission(userRole, PERMISSIONS.REPORTS_VIEW_ALL) || 
                   hasPermission(userRole, PERMISSIONS.REPORTS_VIEW_DEPARTMENT),
      generateReports: hasPermission(userRole, PERMISSIONS.REPORTS_GENERATE),
      
      // Attendance permissions
      viewAllAttendance: hasPermission(userRole, PERMISSIONS.ATTENDANCE_VIEW_ALL) || 
                         hasPermission(userRole, PERMISSIONS.ATTENDANCE_VIEW_DEPARTMENT),
      manageAttendance: hasPermission(userRole, PERMISSIONS.ATTENDANCE_MANAGE_ALL) || 
                        hasPermission(userRole, PERMISSIONS.ATTENDANCE_MANAGE_DEPARTMENT),
      clockInOut: hasPermission(userRole, PERMISSIONS.ATTENDANCE_CLOCK_SELF),
      
      // Settings permissions
      viewSettings: hasPermission(userRole, PERMISSIONS.SETTINGS_VIEW),
      modifySettings: hasPermission(userRole, PERMISSIONS.SETTINGS_MODIFY),
      
      // System permissions
      viewAudit: hasPermission(userRole, PERMISSIONS.AUDIT_VIEW),
      manageRoles: hasPermission(userRole, PERMISSIONS.ROLES_MANAGE),
    },
  };
}
