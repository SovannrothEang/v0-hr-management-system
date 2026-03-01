import { withAuth } from "@/lib/auth/with-auth";
import { proxyGet, proxyMutation, proxyDelete } from "@/lib/proxy";

export const GET = withAuth(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/leave-balances/${id}`, "Failed to fetch leave balance");
});

export const PUT = withAuth(async (request, context) => {
  const { id } = await context?.params!;
  return proxyMutation(request, "PUT", `/leave-balances/${id}`, "Failed to update leave balance");
});

export const DELETE = withAuth(async (request, context) => {
  const { id } = await context?.params!;
  return proxyDelete(request, `/leave-balances/${id}`, "Failed to delete leave balance");
});
