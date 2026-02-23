import { NextResponse } from "next/server";
import { withAuthProxy, AuthenticatedRequest } from "@/lib/auth/with-auth";
import { proxyMutation } from "@/lib/proxy";

export const POST = withAuthProxy(async (request: AuthenticatedRequest) => {
  const csrfToken = request.headers.get("x-csrf-token");
  const sessionId = request.headers.get("x-session-id");
  
  console.log("[Change Password] Headers received:", {
    csrfToken: csrfToken ? `${csrfToken.substring(0, 8)}...` : null,
    sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null,
  });

  return proxyMutation(
    request,
    "POST",
    "/auth/change-password",
    "Failed to change password"
  );
});
