/**
 * ProtectedAction Component
 * Conditionally renders children based on user permissions
 */

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import type { RoleName, PermissionName } from '@/lib/constants/roles';

interface ProtectedActionProps {
  children: ReactNode;
  // Role-based protection
  allowedRoles?: RoleName[];
  // Permission-based protection
  requiredPermission?: PermissionName;
  requiredPermissions?: PermissionName[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  // Fallback content when user doesn't have permission
  fallback?: ReactNode;
  // Hide completely vs show disabled state
  hideWhenUnauthorized?: boolean;
}

export function ProtectedAction({
  children,
  allowedRoles,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback = null,
  hideWhenUnauthorized = true,
}: ProtectedActionProps) {
  const { hasRole, hasPermission, hasAnyPermission } = usePermissions();

  // Check role-based access
  if (allowedRoles && !hasRole(allowedRoles)) {
    return hideWhenUnauthorized ? null : <>{fallback}</>;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return hideWhenUnauthorized ? null : <>{fallback}</>;
  }

  // Check multiple permissions
  if (requiredPermissions) {
    if (requireAll) {
      // User must have ALL permissions
      const hasAll = requiredPermissions.every((perm) => hasPermission(perm));
      if (!hasAll) {
        return hideWhenUnauthorized ? null : <>{fallback}</>;
      }
    } else {
      // User must have ANY permission
      if (!hasAnyPermission(requiredPermissions)) {
        return hideWhenUnauthorized ? null : <>{fallback}</>;
      }
    }
  }

  // User has required permissions, render children
  return <>{children}</>;
}

// Convenience wrapper for admin-only actions
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin } = usePermissions();
  return isAdmin ? <>{children}</> : <>{fallback || null}</>;
}

// Convenience wrapper for admin or HR actions
export function AdminOrHROnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdminOrHR } = usePermissions();
  return isAdminOrHR ? <>{children}</> : <>{fallback || null}</>;
}

// Convenience wrapper to show content only for employees
export function EmployeeOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isEmployee } = usePermissions();
  return isEmployee ? <>{children}</> : <>{fallback || null}</>;
}
