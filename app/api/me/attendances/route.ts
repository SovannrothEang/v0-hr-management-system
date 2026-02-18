import { withAuth } from "@/lib/auth/with-auth";
import { proxyGet } from "@/lib/proxy";

export const GET = withAuth(async (request) => {
  return proxyGet(request, "/me/attendances", "Failed to fetch my attendances");
});
