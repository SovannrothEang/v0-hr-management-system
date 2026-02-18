import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyDelete } from "@/lib/proxy";

export const DELETE = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyDelete(request, `/tax-brackets/${id}`, "Failed to delete tax bracket");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
