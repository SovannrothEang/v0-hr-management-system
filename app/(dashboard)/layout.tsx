"use client";

import React from "react"

import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { SessionTimeoutWarning } from "@/components/auth/session-timeout-warning";
import { useSidebarStore } from "@/stores/sidebar-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebarStore();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <main
          className={cn(
            "transition-all duration-300",
            isCollapsed ? "ml-16" : "ml-64"
          )}
        >
          {children}
        </main>
        <SessionTimeoutWarning />
      </div>
    </AuthGuard>
  );
}
