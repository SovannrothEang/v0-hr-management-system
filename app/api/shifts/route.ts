import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyMutation } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/shifts", "Failed to fetch shifts");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const POST = withRole(async (request) => {
  return proxyMutation(request, "POST", "/shifts", "Failed to create shift");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
