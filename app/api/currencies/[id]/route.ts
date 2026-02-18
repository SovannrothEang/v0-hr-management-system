import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyDelete } from "@/lib/proxy";

export const GET = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/currencies/${id}`, "Failed to fetch currency");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const DELETE = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyDelete(request, `/currencies/${id}`, "Failed to delete currency");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
