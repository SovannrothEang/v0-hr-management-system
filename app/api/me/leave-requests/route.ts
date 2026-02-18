import { withAuth } from "@/lib/auth/with-auth";
import { proxyGet } from "@/lib/proxy";

export const GET = withAuth(async (request) => {
  return proxyGet(request, "/me/leave-requests", "Failed to fetch my leave requests");
});
