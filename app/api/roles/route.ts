import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyMutation } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/roles", "Failed to fetch roles");
}, [ROLES.ADMIN]);

export const POST = withRole(async (request) => {
  return proxyMutation(request, "POST", "/roles", "Failed to create role");
}, [ROLES.ADMIN]);
