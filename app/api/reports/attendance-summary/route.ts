import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/reports/attendance-summary", "Failed to fetch attendance summary report");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
