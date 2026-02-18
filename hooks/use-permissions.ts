/**
 * usePermissions Hook
 * Provides role-based permission checks for UI components
 */

import { useSessionStore } from '@/stores/session';
import { ROLES, PERMISSIONS, hasRole, hasPermission, hasAnyPermission } from '@/lib/constants/roles';
import type { RoleName, PermissionName } from '@/lib/constants/roles';

export function usePermissions() {
  const { user } = useSessionStore();
  const userRoles = user?.roles as RoleName[] | undefined;

  // Helper to check if user has a specific role
  const hasRoleCheck = (role: RoleName): boolean => {
    return userRoles?.includes(role) ?? false;
  };

  // Get the first role (for backward compatibility with single role display)
  const role = userRoles?.[0] as RoleName | undefined;

  return {
    // User info
    user,
    roles: userRoles,
    role, // First role for backward compatibility
    
    // Role checks
    isAdmin: hasRoleCheck(ROLES.ADMIN),
    isHRManager: hasRoleCheck(ROLES.HR_MANAGER),
    isEmployee: hasRoleCheck(ROLES.EMPLOYEE),
    
    // Combined role checks
    isAdminOrHR: hasRoleCheck(ROLES.ADMIN) || hasRoleCheck(ROLES.HR_MANAGER),
    
    // Generic role check
    hasRole: (allowedRoles: RoleName[]) => hasRole(userRoles, allowedRoles),
    
    // Permission checks
    hasPermission: (permission: PermissionName) => hasPermission(userRoles, permission),
    hasAnyPermission: (permissions: PermissionName[]) => hasAnyPermission(userRoles, permissions),
    
    // Feature flags based on roles
    can: {
      // Employee permissions
      viewAllEmployees: hasPermission(userRoles, PERMISSIONS.EMPLOYEE_VIEW_ALL),
      createEmployee: hasPermission(userRoles, PERMISSIONS.EMPLOYEE_CREATE),
      updateEmployee: hasPermission(userRoles, PERMISSIONS.EMPLOYEE_UPDATE_ALL) || 
                      hasPermission(userRoles, PERMISSIONS.EMPLOYEE_UPDATE_DEPARTMENT),
      deleteEmployee: hasPermission(userRoles, PERMISSIONS.EMPLOYEE_DELETE_ALL) || 
                      hasPermission(userRoles, PERMISSIONS.EMPLOYEE_DELETE_DEPARTMENT),
      
      // Payroll permissions
      viewPayroll: hasPermission(userRoles, PERMISSIONS.PAYROLL_VIEW_ALL) || 
                   hasPermission(userRoles, PERMISSIONS.PAYROLL_VIEW_DEPARTMENT),
      generatePayroll: hasPermission(userRoles, PERMISSIONS.PAYROLL_GENERATE),
      processPayroll: hasPermission(userRoles, PERMISSIONS.PAYROLL_PROCESS),
      approvePayroll: hasPermission(userRoles, PERMISSIONS.PAYROLL_APPROVE),
      
      // Leave permissions
      viewAllLeaveRequests: hasPermission(userRoles, PERMISSIONS.LEAVE_VIEW_ALL) || 
                            hasPermission(userRoles, PERMISSIONS.LEAVE_VIEW_DEPARTMENT),
      approveLeaveRequest: hasPermission(userRoles, PERMISSIONS.LEAVE_APPROVE),
      submitLeaveRequest: hasPermission(userRoles, PERMISSIONS.LEAVE_SUBMIT),
      
      // Reports permissions
      viewReports: hasPermission(userRoles, PERMISSIONS.REPORTS_VIEW_ALL) || 
                   hasPermission(userRoles, PERMISSIONS.REPORTS_VIEW_DEPARTMENT),
      generateReports: hasPermission(userRoles, PERMISSIONS.REPORTS_GENERATE),
      
      // Attendance permissions
      viewAllAttendance: hasPermission(userRoles, PERMISSIONS.ATTENDANCE_VIEW_ALL) || 
                         hasPermission(userRoles, PERMISSIONS.ATTENDANCE_VIEW_DEPARTMENT),
      manageAttendance: hasPermission(userRoles, PERMISSIONS.ATTENDANCE_MANAGE_ALL) || 
                        hasPermission(userRoles, PERMISSIONS.ATTENDANCE_MANAGE_DEPARTMENT),
      clockInOut: hasPermission(userRoles, PERMISSIONS.ATTENDANCE_CLOCK_SELF),
      
      // Settings permissions
      viewSettings: hasPermission(userRoles, PERMISSIONS.SETTINGS_VIEW),
      modifySettings: hasPermission(userRoles, PERMISSIONS.SETTINGS_MODIFY),
      
      // System permissions
      viewAudit: hasPermission(userRoles, PERMISSIONS.AUDIT_VIEW),
      manageRoles: hasPermission(userRoles, PERMISSIONS.ROLES_MANAGE),

      // Position permissions
      viewAllPositions: hasPermission(userRoles, PERMISSIONS.POSITION_VIEW_ALL),
      createPosition: hasPermission(userRoles, PERMISSIONS.POSITION_CREATE),
      updatePosition: hasPermission(userRoles, PERMISSIONS.POSITION_UPDATE_ALL),
      deletePosition: hasPermission(userRoles, PERMISSIONS.POSITION_DELETE_ALL),
    },
  };
}
