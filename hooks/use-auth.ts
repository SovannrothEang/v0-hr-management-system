/**
 * Authentication Hooks
 * Provides login and logout functionality using cookie-based sessions
 */

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useSessionStore, type User } from "@/stores/session";
import { toast } from "sonner";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  expiresAt: number;
  csrfToken: string;
}

/**
 * Hook for user login
 * Sends credentials to server, which sets httpOnly cookies
 * Client stores user info and CSRF token only
 */
export function useLogin() {
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Store user info and session data (no tokens stored client-side)
      setSession(data.user, data.expiresAt, data.csrfToken);
      toast.success("Login successful", {
        description: `Welcome back, ${data.user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast.error("Login failed", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for user logout
 * Calls server to clear httpOnly cookies, then clears client state
 */
export function useLogout() {
  const clearSession = useSessionStore((state) => state.clearSession);

  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/auth/logout");
    },
    onSuccess: () => {
      clearSession();
      toast.success("Logged out successfully");
    },
    onError: () => {
      // Clear session anyway on error
      clearSession();
    },
  });
}

/**
 * Hook for refreshing the session
 * Calls server to refresh tokens in cookies
 */
export function useRefreshSession() {
  const updateSessionExpiry = useSessionStore((state) => state.updateSessionExpiry);

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        user: User;
        expiresAt: number;
        csrfToken: string;
      }>("/auth/refresh");
      return response.data;
    },
    onSuccess: (data) => {
      updateSessionExpiry(data.expiresAt, data.csrfToken);
    },
  });
}
