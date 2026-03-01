/**
 * Client-Side Session Store
 * Manages user session state using Zustand with Bearer token authentication
 * Access token is stored in memory (not localStorage) for security
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RoleName } from "@/lib/constants/roles";

export type UserRole = RoleName;

export interface User {
  id: string;
  email: string;
  username: string;
  roles: UserRole[];
  avatar?: string;
  department?: string;
  employeeId?: string;
}

interface SessionState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiresAt: number | null; // Unix timestamp in milliseconds
  accessToken: string | null; // Stored in memory, not persisted
  csrfToken: string | null;
  sessionId: string | null; // Backend session ID for CSRF validation

  // Actions
  setSession: (user: User, expiresAt: number, csrfToken: string, accessToken: string, sessionId?: string) => void;
  setAccessToken: (token: string) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  updateSessionExpiry: (expiresAt: number, csrfToken?: string) => void;
  checkSession: () => Promise<boolean>;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sessionExpiresAt: null,
      accessToken: null,
      csrfToken: null,
      sessionId: null,

      /**
       * Set session after successful login
       */
      setSession: (user: User, expiresAt: number, csrfToken: string, accessToken: string, sessionId?: string) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          sessionExpiresAt: expiresAt,
          csrfToken,
          accessToken,
          sessionId: sessionId || null,
        }),

      /**
       * Set access token (for token refresh)
       */
      setAccessToken: (token: string) =>
        set({
          accessToken: token,
        }),

      /**
       * Clear session on logout or session expiry
       */
      clearSession: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          sessionExpiresAt: null,
          accessToken: null,
          csrfToken: null,
          sessionId: null,
        }),

      /**
       * Set loading state
       */
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      /**
       * Update session expiry after token refresh
       */
      updateSessionExpiry: (expiresAt: number, csrfToken?: string) =>
        set((state) => ({
          sessionExpiresAt: expiresAt,
          csrfToken: csrfToken ?? state.csrfToken,
        })),

      /**
       * Validate session with server
       * Returns true if session is valid, false otherwise
       */
      checkSession: async () => {
        const state = get();
        
        // Even if we don't have an in-memory access token, we should check with the server
        // because we might have a valid session cookie (auth_token or refresh_token).
        // The server-side /auth/session endpoint now handles transparent refresh.
        
        try {
          set({ isLoading: true });

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/auth/session`, {
            method: 'GET',
            headers: state.accessToken ? {
              'Authorization': `Bearer ${state.accessToken}`,
            } : {},
            credentials: 'include', // Ensure cookies are sent for session check
          });

          if (!response.ok) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              sessionExpiresAt: null,
              csrfToken: null,
              accessToken: null,
            });
            return false;
          }

          const data = await response.json();

          if (data.data?.user) {
            // If tokens were refreshed on the server, update the store
            const { accessToken, csrfToken, expiresAt } = data.data;
            
            set({
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
              sessionExpiresAt: expiresAt || state.sessionExpiresAt,
              accessToken: accessToken || state.accessToken,
              csrfToken: csrfToken || state.csrfToken,
            });
            return true;
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessionExpiresAt: null,
            csrfToken: null,
            accessToken: null,
          });
          return false;
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessionExpiresAt: null,
            csrfToken: null,
            accessToken: null,
          });
          return false;
        }
      },
    }),
    {
      name: "hrflow-session",
      // Persist user data, session expiry, and access token for cross-page reload support
      // Note: Access token is stored in localStorage (not httpOnly cookie) for frontend convenience
      // Security is maintained through: HTTPS, CORS, CSRF, short expiry (1h), and automatic refresh
      partialize: (state) => ({
        user: state.user,
        sessionExpiresAt: state.sessionExpiresAt,
        accessToken: state.accessToken,
        sessionId: state.sessionId,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, validate session with server
        if (state) {
          state.setLoading(true);
          // Defer checkSession to allow component mounting
          setTimeout(() => {
            state.checkSession();
          }, 0);
        }
      },
    }
  )
);

/**
 * Helper hook to get access token for API requests
 */
export function useAccessToken(): string | null {
  return useSessionStore((state) => state.accessToken);
}

/**
 * Get access token synchronously (for use in apiClient)
 */
export function getAccessToken(): string | null {
  return useSessionStore.getState().accessToken;
}

/**
 * Helper hook to get CSRF token for API requests
 */
export function useCsrfToken(): string | null {
  return useSessionStore((state) => state.csrfToken);
}

/**
 * Get CSRF token synchronously (for use in apiClient)
 * Falls back to reading the csrf_token cookie if the store value is null
 * (e.g. after page reload, since csrfToken is not persisted)
 */
export function getCsrfToken(): string | null {
  const storeToken = useSessionStore.getState().csrfToken;
  if (storeToken) return storeToken;

  // Fallback: read from cookie (httpOnly: false, so JS can access it)
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  return null;
}

/**
 * Get session ID synchronously (for use in apiClient)
 */
export function getSessionId(): string | null {
  return useSessionStore.getState().sessionId;
}
