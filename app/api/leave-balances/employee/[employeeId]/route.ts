import { withAuth } from "@/lib/auth/with-auth";
import { proxyGet } from "@/lib/proxy";

export const GET = withAuth(async (request, context) => {
  const { employeeId } = await context?.params!;
  return proxyGet(request, `/leave-balances/employee/${employeeId}`, "Failed to fetch employee leave balances");
});
