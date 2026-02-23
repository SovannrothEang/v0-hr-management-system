import { NextResponse } from "next/server";
import { withAuthProxy, AuthenticatedRequest } from "@/lib/auth/with-auth";
import { proxyGet, proxyMutation } from "@/lib/proxy";

export const GET = withAuthProxy(async (request: AuthenticatedRequest) => {
  return proxyGet(
    request,
    "/settings/company",
    "Failed to fetch company settings"
  );
});

export const PUT = withAuthProxy(async (request: AuthenticatedRequest) => {
  return proxyMutation(
    request,
    "PUT",
    "/settings/company",
    "Failed to update company settings"
  );
});
