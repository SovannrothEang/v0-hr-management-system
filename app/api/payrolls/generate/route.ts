import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyMutation } from "@/lib/proxy";

export const POST = withRole(async (request) => {
  return proxyMutation(request, "POST", "/payrolls/generate", "Failed to generate payroll");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
