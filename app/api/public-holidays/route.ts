import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyMutation } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/public-holidays", "Failed to fetch public holidays");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const POST = withRole(async (request) => {
  return proxyMutation(request, "POST", "/public-holidays", "Failed to create public holiday");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
