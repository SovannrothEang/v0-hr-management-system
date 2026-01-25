import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";

export const POST = withRole(async (request) => {
  try {
    const body = await request.json();
    const { ids } = body;
    const metadata = getRequestMetadata(request);

    // Get user from request (set by withRole middleware)
    const user = (request as any).user;

    // Log the critical action
    logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, user, {
      ...metadata,
      resource: 'payroll',
      details: { 
        payrollIds: ids,
        count: ids.length,
      },
      success: true,
    });

    return NextResponse.json({
      success: true,
      data: ids.map((id: string) => ({
        id,
        status: "paid",
        paidAt: new Date().toISOString(),
      })),
    });
  } catch (error) {
    // Log the failed action
    const user = (request as any).user;
    const metadata = getRequestMetadata(request);
    
    logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, user, {
      ...metadata,
      resource: 'payroll',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, message: "Failed to mark payroll as paid" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);
