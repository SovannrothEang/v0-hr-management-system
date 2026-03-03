import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyMutation } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/exchange-rates", "Failed to fetch exchange rates");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const POST = withRole(async (request) => {
  return proxyMutation(request, "POST", "/exchange-rates", "Failed to save exchange rate");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
