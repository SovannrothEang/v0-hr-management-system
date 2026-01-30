/**
 * Authentication Hooks
 * Provides login and logout functionality using Bearer token authentication
 * Access token is stored in memory (React state) for security
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
  accessToken: string;
  user: User;
  expiresAt: number;
  csrfToken?: string;
}

/**
 * Hook for user login
 * Sends credentials to server, receives access token
 * Client stores access token in memory (not localStorage)
 */
export function useLogin() {
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Use fetch directly to avoid circular dependency with apiClient
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Extract CSRF token from cookies
      const cookies = response.headers.get('set-cookie');
      const csrfToken = cookies?.match(/csrf_token=([^;]+)/)?.[1] || '';
      
      return {
        ...data.data,
        csrfToken,
      };
    },
    onSuccess: (data: LoginResponse & { csrfToken?: string }) => {
      // Store user info, access token, and CSRF token in memory
      setSession(data.user, data.expiresAt, data.csrfToken || '', data.accessToken);
      toast.success("Login successful", {
        description: `Welcome back, ${data.user.name || data.user.username}!`,
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
 * Clears session state (access token is in memory, so it's automatically cleared)
 */
export function useLogout() {
  const clearSession = useSessionStore((state) => state.clearSession);

  return useMutation({
    mutationFn: async () => {
      // Call logout endpoint if needed
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
 * Calls server to refresh access token
 */
export function useRefreshSession() {
  const updateSessionExpiry = useSessionStore((state) => state.updateSessionExpiry);

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        accessToken: string;
        expiresAt: number;
      }>("/auth/refresh");
      return response.data;
    },
    onSuccess: (data) => {
      updateSessionExpiry(data.expiresAt);
    },
  });
}
