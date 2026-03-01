import { withAuth } from "@/lib/auth/with-auth";
import { proxyGet, proxyMutation, proxyDelete } from "@/lib/proxy";

export const GET = withAuth(async (request) => {
  return proxyGet(request, "/leave-balances", "Failed to fetch leave balances");
});

export const POST = withAuth(async (request) => {
  return proxyMutation(request, "POST", "/leave-balances", "Failed to create leave balance");
});
