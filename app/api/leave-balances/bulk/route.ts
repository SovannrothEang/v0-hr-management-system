import { withAuth } from "@/lib/auth/with-auth";
import { proxyMutation } from "@/lib/proxy";

export const POST = withAuth(async (request) => {
  return proxyMutation(request, "POST", "/leave-balances/bulk", "Failed to create leave balances");
});
