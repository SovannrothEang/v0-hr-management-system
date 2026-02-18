import { withAuth } from "@/lib/auth/with-auth";
import { proxyMutation } from "@/lib/proxy";

export const POST = withAuth(async (request) => {
  return proxyMutation(request, "POST", "/attendances/clock-in", "Failed to clock in");
});
