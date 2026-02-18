import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyMutation } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/positions", "Failed to fetch positions");
}, [ROLES.ADMIN]);

export const POST = withRole(async (request) => {
  return proxyMutation(request, "POST", "/positions", "Failed to create position");
}, [ROLES.ADMIN]);
