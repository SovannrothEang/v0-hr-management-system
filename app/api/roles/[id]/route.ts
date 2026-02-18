import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyMutation, proxyDelete } from "@/lib/proxy";

export const GET = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/roles/${id}`, "Failed to fetch role");
}, [ROLES.ADMIN]);

export const PUT = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyMutation(request, "PUT", `/roles/${id}`, "Failed to update role");
}, [ROLES.ADMIN]);

export const DELETE = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyDelete(request, `/roles/${id}`, "Failed to delete role");
}, [ROLES.ADMIN]);
