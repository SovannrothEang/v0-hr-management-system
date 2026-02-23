/**
 * Authentication Hooks
 * Provides login and logout functionality using Bearer token authentication
 * Access token is stored in memory (React state) for security
 */

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
  sessionId?: string;
}

const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  CSRF_TOKEN: 'csrf_token',
  SESSION_STORE: 'hrflow-session',
};

function clearAllClientSession(): void {
  if (typeof document === 'undefined') return;

  const paths = ['/', '/api/auth'];
  
  for (const name of Object.values(COOKIE_NAMES)) {
    for (const path of paths) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Strict`;
      if (process.env.NODE_ENV === 'production') {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Strict; Secure`;
      }
    }
  }

  localStorage.removeItem(COOKIE_NAMES.SESSION_STORE);
  sessionStorage.clear();
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
        const errorMessage = typeof error.message === 'object' && error.message !== null
          ? error.message.message 
          : error.message;
        throw new Error(errorMessage || 'Login failed');
      }

      const data = await response.json();

      return {
        ...data.data,
      };
    },
    onSuccess: (data: LoginResponse & { csrfToken?: string; sessionId?: string }) => {
      console.log("[Login Success] Storing session:", {
        hasCsrfToken: !!data.csrfToken,
        hasSessionId: !!data.sessionId,
        csrfToken: data.csrfToken ? `${data.csrfToken.substring(0, 8)}...` : null,
        sessionId: data.sessionId ? `${data.sessionId.substring(0, 8)}...` : null,
      });
      setSession(data.user, data.expiresAt, data.csrfToken || '', data.accessToken, data.sessionId);
      toast.success("Login successful", {
        description: `Welcome back, ${data.user.username || data.user.email}!`,
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
 * Calls logout API and clears all session data
 */
export function useLogout() {
  const clearSession = useSessionStore((state) => state.clearSession);
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/auth/logout`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );
      } catch {
        // Ignore errors from logout API
      }
    },
    onSettled: () => {
      clearAllClientSession();
      clearSession();
      toast.success("Logged out successfully");
      router.replace("/login");
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
    mutationFn: async (): Promise<{ accessToken: string; expiresAt: number }> => {
      const response = await apiClient.post<{
        accessToken: string;
        expiresAt: number;
      } | { data: { accessToken: string; expiresAt: number } }>("/auth/refresh");

      const data = response.data;
      return (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;
    },
    onSuccess: (data) => {
      updateSessionExpiry(data.expiresAt);
    },
  });
}
