/**
 * Employee Report Export Endpoint
 * Proxies export requests to the external HRMS API
 */

import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyExport } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyExport(request, "/reports/employees/export", "Failed to export employee report");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
