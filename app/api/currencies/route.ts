import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyMutation } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/currencies", "Failed to fetch currencies");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const POST = withRole(async (request) => {
  return proxyMutation(request, "POST", "/currencies", "Failed to create currency");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
