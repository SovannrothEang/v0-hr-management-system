import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet, proxyDelete } from "@/lib/proxy";

export const GET = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/public-holidays/${id}`, "Failed to fetch public holiday");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);

export const DELETE = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyDelete(request, `/public-holidays/${id}`, "Failed to delete public holiday");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
