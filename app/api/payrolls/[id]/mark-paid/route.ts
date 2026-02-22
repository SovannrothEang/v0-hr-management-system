import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";
import { getExternalApiUrl } from "@/lib/proxy";

export const PATCH = withRole(async (request, context) => {
  const { id } = await context?.params!;

  try {
    const body = await request.json().catch(() => ({}));
    const { paymentDate } = body;
    const metadata = getRequestMetadata(request);

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, request.user, {
        ...metadata,
        resource: 'payroll',
        resourceId: id,
        success: false,
        errorMessage: errorData.message || 'Failed to mark as paid',
      });

      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to mark payroll as paid" },
        { status: response.status }
      );
    }

    const data = await response.json();

    logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, request.user, {
      ...metadata,
      resource: 'payroll',
      resourceId: id,
      success: true,
    });

    return NextResponse.json({ success: true, data: data });
  } catch (error) {
    const metadata = getRequestMetadata(request);

    logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, request.user, {
      ...metadata,
      resource: 'payroll',
      resourceId: id,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, message: "Failed to mark payroll as paid" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN]);
