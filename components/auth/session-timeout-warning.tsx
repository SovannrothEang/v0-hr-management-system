/**
 * Session Timeout Warning Component
 * Shows a warning dialog when the user's session is about to expire
 * Uses server-provided expiry time instead of decoding tokens client-side
 */

"use client";

import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/session";
import { useRefreshSession, useLogout } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before expiration

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { sessionExpiresAt, isAuthenticated, clearSession } = useSessionStore();
  const refreshSession = useRefreshSession();
  const logout = useLogout();

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;

    const checkExpiration = () => {
      const currentTime = Date.now();
      const timeUntilExpiration = sessionExpiresAt - currentTime;

      if (timeUntilExpiration <= 0) {
        // Session already expired
        clearSession();
        return;
      }

      // Show warning in last 5 minutes
      if (timeUntilExpiration <= WARNING_TIME) {
        setShowWarning(true);
        setTimeLeft(Math.floor(timeUntilExpiration / 1000));
      }
    };

    // Initial check
    checkExpiration();

    // Set up countdown timer
    const countdownInterval = setInterval(() => {
      const currentTime = Date.now();
      const remaining = Math.floor((sessionExpiresAt - currentTime) / 1000);

      if (remaining <= 300) { // Last 5 minutes
        setShowWarning(true);
        setTimeLeft(remaining);
      }

      if (remaining <= 0) {
        clearInterval(countdownInterval);
        clearSession();
        window.location.href = '/login';
      }
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [sessionExpiresAt, isAuthenticated, clearSession]);

  const handleExtendSession = async () => {
    try {
      await refreshSession.mutateAsync();
      setShowWarning(false);
      toast.success("Session extended", {
        description: "Your session has been extended for another 24 hours",
      });
    } catch (error) {
      toast.error("Failed to extend session", {
        description: "Please log in again",
      });
      clearSession();
      window.location.href = '/login';
    }
  };

  const handleLogout = () => {
    logout.mutate();
    setShowWarning(false);
    window.location.href = '/login';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in <strong>{formatTime(timeLeft)}</strong>.
            {"\n\n"}
            Would you like to extend your session or log out?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>
            Log Out
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleExtendSession}
            disabled={refreshSession.isPending}
          >
            {refreshSession.isPending ? "Extending..." : "Extend Session"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
