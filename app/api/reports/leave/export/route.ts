import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyExport } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyExport(request, "/reports/leaves/export", "Failed to export leave report");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
