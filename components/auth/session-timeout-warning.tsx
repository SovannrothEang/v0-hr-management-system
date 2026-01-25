/**
 * Session Timeout Warning Component
 * Shows a warning dialog when the user's session is about to expire
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
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
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before expiration
const TOKEN_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { token, refreshToken, isAuthenticated, logout, updateTokens } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Decode token to get expiration time
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      if (timeUntilExpiration <= 0) {
        // Token already expired
        logout();
        return;
      }

      // Set timer to show warning
      const warningTimeout = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(Math.floor((timeUntilExpiration - WARNING_TIME) / 1000));
      }, Math.max(0, timeUntilExpiration - WARNING_TIME));

      // Countdown timer
      const countdownInterval = setInterval(() => {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const remaining = Math.floor((expirationTime - currentTime) / 1000);
        
        if (remaining <= 300) { // Last 5 minutes
          setTimeLeft(remaining);
        }

        if (remaining <= 0) {
          clearInterval(countdownInterval);
          logout();
        }
      }, 1000);

      return () => {
        clearTimeout(warningTimeout);
        clearInterval(countdownInterval);
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }, [token, isAuthenticated, logout]);

  const handleExtendSession = async () => {
    try {
      if (!refreshToken) {
        toast.error("Cannot extend session", {
          description: "No refresh token available",
        });
        logout();
        return;
      }

      const response = await apiClient.post<{
        token: string;
        refreshToken: string;
        user: any;
      }>("/auth/refresh", { refreshToken });

      if (response.success && response.data.token && response.data.refreshToken) {
        updateTokens(response.data.token, response.data.refreshToken);
        setShowWarning(false);
        toast.success("Session extended", {
          description: "Your session has been extended for another 24 hours",
        });
      }
    } catch (error) {
      toast.error("Failed to extend session", {
        description: "Please log in again",
      });
      logout();
    }
  };

  const handleLogout = () => {
    logout();
    setShowWarning(false);
  };

  const formatTime = (seconds: number) => {
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
          <AlertDialogAction onClick={handleExtendSession}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
