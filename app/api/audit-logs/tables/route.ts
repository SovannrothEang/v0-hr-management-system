import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/audit-logs/tables", "Failed to fetch audit log tables");
}, [ROLES.ADMIN]);
