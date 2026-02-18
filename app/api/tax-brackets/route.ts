import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyMutation } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/tax-brackets", "Failed to fetch tax brackets");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const POST = withRole(async (request) => {
  return proxyMutation(request, "POST", "/tax-brackets", "Failed to create tax bracket");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
