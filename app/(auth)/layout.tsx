import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, getAuthSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Removed server-side redirect to prevent loop with client-side session clearing.
  // Redirect logic is now handled in the login page component.
  return <>{children}</>;
}
