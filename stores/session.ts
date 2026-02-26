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
  refreshSession: () => Promise<boolean>;
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
       * If no access token but refresh token exists, will attempt to refresh
       */
      checkSession: async () => {
        const state = get();
        
        // If no access token, try to refresh using refresh token cookie
        if (!state.accessToken) {
          console.log('[Session] No access token, attempting refresh...');
          const refreshed = await get().refreshSession();
          if (!refreshed) {
            console.log('[Session] Refresh failed, clearing session');
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
          return true;
        }
        
        try {
          set({ isLoading: true });

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/auth/session`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${state.accessToken}`,
            },
          });

          if (response.status === 401) {
            // Access token expired, try to refresh
            console.log('[Session] Session check returned 401, attempting refresh...');
            const refreshed = await get().refreshSession();
            if (!refreshed) {
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
            return true;
          }

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
            set({
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
              sessionExpiresAt: data.data.expiresAt || state.sessionExpiresAt,
              accessToken: state.accessToken,
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
        } catch (error) {
          console.error('[Session] Check session error:', error);
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

      /**
       * Refresh session using refresh token cookie
       * Returns true if refresh succeeded, false otherwise
       */
      refreshSession: async () => {
        try {
          console.log('[Session] Calling refresh endpoint...');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (!response.ok) {
            console.log('[Session] Refresh failed with status:', response.status);
            return false;
          }

          const data = await response.json();
          
          if (data.success && data.data) {
            const { accessToken, csrfToken, expiresAt, user, sessionId } = data.data;
            
            if (accessToken) {
              const currentState = get();
              set({
                user: user || currentState.user,
                isAuthenticated: true,
                isLoading: false,
                sessionExpiresAt: expiresAt || Date.now() + 24 * 60 * 60 * 1000,
                accessToken,
                csrfToken: csrfToken || currentState.csrfToken,
                sessionId: sessionId || currentState.sessionId,
              });
              console.log('[Session] Token refreshed successfully');
              return true;
            }
          }
          
          console.log('[Session] Refresh response missing accessToken');
          return false;
        } catch (error) {
          console.error('[Session] Refresh error:', error);
          return false;
        }
      },
    }),
    {
      name: "hrflow-session",
      // Only persist user data for display purposes
      // DO NOT persist auth tokens - they should always come from httpOnly cookies
      // This prevents the app from thinking user is logged in when cookies are deleted
      partialize: (state) => ({
        user: state.user,
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
