import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";
import { proxyGet } from "@/lib/proxy";

export const GET = withRole(async (request) => {
  return proxyGet(request, "/attendances/qr/in", "Failed to generate QR check-in token");
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
