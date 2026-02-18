/**
 * Payroll Report Export Endpoint
 * Proxies export requests to the external HRMS API
 */

import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyExport } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyExport(request, "/reports/payrolls/export", "Failed to export payroll report");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
