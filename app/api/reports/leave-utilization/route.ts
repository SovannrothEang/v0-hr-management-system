import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/reports/leave-utilization", "Failed to fetch leave utilization report");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
