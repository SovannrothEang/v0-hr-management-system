import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyDelete } from "@/lib/proxy";

export const GET = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/shifts/${id}`, "Failed to fetch shift");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const DELETE = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyDelete(request, `/shifts/${id}`, "Failed to delete shift");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
