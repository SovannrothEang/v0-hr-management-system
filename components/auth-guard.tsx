/**
 * Auth Guard Component
 * Protects routes by validating session with server
 * Shows loading state while checking authentication
 */

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkSession } = useSessionStore();

  useEffect(() => {
    // Validate session with server on mount
    checkSession().then((isValid) => {
      if (!isValid) {
        router.push("/login");
      }
    });
  }, [checkSession, router]);

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
