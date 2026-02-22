import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";
import { getExternalApiUrl } from "@/lib/proxy";

export const POST = withRole(async (request) => {
  try {
    const body = await request.json();
    const { ids, paymentDate } = body;
    const metadata = getRequestMetadata(request);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Payroll IDs are required" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const id of ids) {
      const response = await fetch(
        `${getExternalApiUrl()}/payrolls/${id}/mark-paid`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
          },
          body: JSON.stringify({ paymentDate }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        results.push(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        errors.push({ id, error: errorData.message || 'Failed to mark as paid' });
      }
    }

    if (errors.length > 0) {
      logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, request.user, {
        ...metadata,
        resource: 'payroll',
        success: false,
        details: { errors, successCount: results.length, failCount: errors.length },
      });

      return NextResponse.json({
        success: false,
        message: `${errors.length} payroll(s) failed to mark as paid`,
        data: { results, errors },
      }, { status: 400 });
    }

    logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, request.user, {
      ...metadata,
      resource: 'payroll',
      details: {
        payrollIds: ids,
        count: ids.length,
      },
      success: true,
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
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
