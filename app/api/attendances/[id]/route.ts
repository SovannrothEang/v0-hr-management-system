import { withAuth } from "@/lib/auth/with-auth";
import { proxyGet } from "@/lib/proxy";

export const GET = withAuth(async (request, context) => {
  const { id } = await context?.params!;
  return proxyGet(request, `/attendances/${id}`, "Failed to fetch attendance record");
});
