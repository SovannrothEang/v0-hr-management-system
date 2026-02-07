import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";

export const POST = withRole(async (request) => {
  try {
    const body = await request.json();
    const metadata = getRequestMetadata(request);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/payrolls/mark-paid`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, request.user, {
        ...metadata,
        resource: 'payroll',
        success: false,
        errorMessage: errorData.message || 'Failed to mark as paid',
      });

      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to mark payroll as paid" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log the critical action
    logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, request.user, {
      ...metadata,
      resource: 'payroll',
      details: {
        payrollIds: body.ids,
        count: body.ids?.length,
      },
      success: true,
    });

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    // Log the failed action
    const metadata = getRequestMetadata(request);

    logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, request.user, {
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
