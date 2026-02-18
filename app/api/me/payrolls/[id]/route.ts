import { withAuth } from "@/lib/auth/with-auth";
import { proxyGet } from "@/lib/proxy";

export const GET = withAuth(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/me/payrolls/${id}`, "Failed to fetch payslip details");
});
