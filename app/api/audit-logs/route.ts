/**
 * Audit Logs API Endpoint
 * Allows admins to view audit logs
 */

import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { getAuditLogs, AuditAction, AuditSeverity } from "@/lib/audit-log";

export const GET = withRole(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') as AuditAction || undefined;
    const severity = searchParams.get('severity') as AuditSeverity || undefined;
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined;
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined;

    const result = getAuditLogs({
      limit,
      offset,
      userId,
      action,
      severity,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Failed to get audit logs:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve audit logs" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);
