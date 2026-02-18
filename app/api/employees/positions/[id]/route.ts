import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyMutation, proxyDelete } from "@/lib/proxy";

export const GET = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/employees/positions/${id}`, "Failed to fetch position");
}, [ROLES.ADMIN]);

export const PUT = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyMutation(request, "PUT", `/employees/positions/${id}`, "Failed to update position");
}, [ROLES.ADMIN]);

export const DELETE = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyDelete(request, `/employees/positions/${id}`, "Failed to delete position");
}, [ROLES.ADMIN]);
