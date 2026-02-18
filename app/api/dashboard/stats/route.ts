import { withAuth } from "@/lib/auth/with-auth";
import { proxyGet } from "@/lib/proxy";

export const GET = withAuth(async (request) => {
  return proxyGet(request, "/dashboard/stats", "Failed to fetch dashboard stats");
});
