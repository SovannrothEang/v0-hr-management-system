import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, getAuthSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated server-side
  const session = await getAuthSession();
  
  if (session) {
    // User is already logged in, redirect to appropriate page
    if (session.roles?.includes("HRMS_API" as any)) {
      redirect("/machine");
    } else {
      redirect("/dashboard");
    }
  }
  
  return <>{children}</>;
}
