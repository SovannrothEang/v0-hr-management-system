/**
 * Audit Logging Infrastructure
 * Logs security-sensitive actions for compliance and monitoring
 */

import { JWTPayload } from '@/lib/auth/verify-token';

// Audit event types
export enum AuditAction {
  // Authentication events
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  LOGIN_FAILED = 'LOGIN_FAILED',
  
  // User management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  
  // Employee management
  EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED = 'EMPLOYEE_DELETED',
  EMPLOYEE_VIEWED = 'EMPLOYEE_VIEWED',
  
  // Payroll events
  PAYROLL_GENERATED = 'PAYROLL_GENERATED',
  PAYROLL_PROCESSED = 'PAYROLL_PROCESSED',
  PAYROLL_MARKED_PAID = 'PAYROLL_MARKED_PAID',
  PAYROLL_VIEWED = 'PAYROLL_VIEWED',
  
  // Leave requests
  LEAVE_REQUEST_CREATED = 'LEAVE_REQUEST_CREATED',
  LEAVE_REQUEST_APPROVED = 'LEAVE_REQUEST_APPROVED',
  LEAVE_REQUEST_REJECTED = 'LEAVE_REQUEST_REJECTED',
  
  // Reports
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_EXPORTED = 'REPORT_EXPORTED',
  
  // Access control
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_VIOLATION = 'PERMISSION_VIOLATION',
}

// Audit event severity levels
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Audit log entry
export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  severity: AuditSeverity;
  userId: string;
  userEmail: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

// In-memory store (in production, this would be a database)
const auditLogs: AuditLog[] = [];

/**
 * Log an audit event
 */
export function logAuditEvent(
  action: AuditAction,
  user: JWTPayload | null,
  options: {
    severity?: AuditSeverity;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    resourceId?: string;
    details?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
  } = {}
): void {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    severity: options.severity || getSeverityForAction(action),
    userId: user?.id || 'anonymous',
    userEmail: user?.email || 'anonymous',
    userRole: user?.roles?.join(',') || 'unknown',
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    resource: options.resource,
    resourceId: options.resourceId,
    details: options.details,
    success: options.success !== false, // Default to true
    errorMessage: options.errorMessage,
  };

  auditLogs.push(log);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(log, null, 2));
  }

  // In production, you would:
  // 1. Send to a logging service (e.g., DataDog, Splunk)
  // 2. Store in a database
  // 3. Send to a SIEM system
  // 4. Trigger alerts for critical events
}

/**
 * Get default severity for an action
 */
function getSeverityForAction(action: AuditAction): AuditSeverity {
  switch (action) {
    case AuditAction.LOGIN_FAILED:
    case AuditAction.ACCESS_DENIED:
    case AuditAction.PERMISSION_VIOLATION:
      return AuditSeverity.WARNING;
    
    case AuditAction.USER_DELETED:
    case AuditAction.EMPLOYEE_DELETED:
    case AuditAction.PAYROLL_MARKED_PAID:
      return AuditSeverity.CRITICAL;
    
    case AuditAction.PAYROLL_GENERATED:
    case AuditAction.PAYROLL_PROCESSED:
    case AuditAction.LEAVE_REQUEST_APPROVED:
    case AuditAction.LEAVE_REQUEST_REJECTED:
      return AuditSeverity.WARNING;
    
    default:
      return AuditSeverity.INFO;
  }
}

/**
 * Get audit logs (for admin use)
 */
export function getAuditLogs(options: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  severity?: AuditSeverity;
} = {}): { logs: AuditLog[]; total: number } {
  let filtered = [...auditLogs];

  // Apply filters
  if (options.userId) {
    filtered = filtered.filter(log => log.userId === options.userId);
  }

  if (options.action) {
    filtered = filtered.filter(log => log.action === options.action);
  }

  if (options.severity) {
    filtered = filtered.filter(log => log.severity === options.severity);
  }

  if (options.startDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= options.startDate!);
  }

  if (options.endDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) <= options.endDate!);
  }

  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = filtered.length;
  const offset = options.offset || 0;
  const limit = options.limit || 100;

  return {
    logs: filtered.slice(offset, offset + limit),
    total,
  };
}

/**
 * Helper function to extract IP and User-Agent from request
 */
export function getRequestMetadata(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}
