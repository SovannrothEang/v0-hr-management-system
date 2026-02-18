import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet } from "@/lib/proxy";

export const GET = withRole(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/audit-logs/${id}`, "Failed to fetch audit log entry");
}, [ROLES.ADMIN]);
