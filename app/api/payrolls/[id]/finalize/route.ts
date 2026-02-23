import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { logAuditEvent, AuditAction, getRequestMetadata } from "@/lib/audit-log";
import { getExternalApiUrl } from "@/lib/proxy";

export const PATCH = withRole(async (request, context) => {
  const { id } = await context?.params!;
  const metadata = getRequestMetadata(request);

  try {
    const response = await fetch(
      `${getExternalApiUrl()}/payrolls/${id}/finalize`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      logAuditEvent(AuditAction.PAYROLL_PROCESSED, request.user, {
        ...metadata,
        resource: 'payroll',
        resourceId: id,
        success: false,
        errorMessage: errorData.message || 'Failed to finalize payroll',
      });

      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to finalize payroll" },
        { status: response.status }
      );
    }

    const data = await response.json();

    logAuditEvent(AuditAction.PAYROLL_PROCESSED, request.user, {
      ...metadata,
      resource: 'payroll',
      resourceId: id,
      success: true,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logAuditEvent(AuditAction.PAYROLL_PROCESSED, request.user, {
      ...metadata,
      resource: 'payroll',
      resourceId: id,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, message: "Failed to finalize payroll" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
