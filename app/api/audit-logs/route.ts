/**
 * Audit Logs API Endpoint
 * Proxies to external HRMS API for audit log data
 */

import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/audit-logs", "Failed to fetch audit logs");
}, [ROLES.ADMIN]);
