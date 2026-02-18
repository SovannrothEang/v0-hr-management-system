import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyExport } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyExport(request, "/reports/leave-utilization/export", "Failed to export leave utilization report");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
