/**
 * Client-Side Session Store
 * Manages user session state using Zustand with localStorage persistence
 * Note: Tokens are stored in httpOnly cookies - only user info is persisted here
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RoleName } from "@/lib/constants/roles";

export type UserRole = RoleName;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
  csrfToken: string | null;

  // Actions
  setSession: (user: User, expiresAt: number, csrfToken: string) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  updateSessionExpiry: (expiresAt: number, csrfToken?: string) => void;
  checkSession: () => Promise<boolean>;
}

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sessionExpiresAt: null,
      csrfToken: null,

      /**
       * Set session after successful login
       */
      setSession: (user, expiresAt, csrfToken) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          sessionExpiresAt: expiresAt,
          csrfToken,
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
          csrfToken: null,
        }),

      /**
       * Set loading state
       */
      setLoading: (loading) => set({ isLoading: loading }),

      /**
       * Update session expiry after token refresh
       */
      updateSessionExpiry: (expiresAt, csrfToken) =>
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
        
        // If no user in store, try to validate with server anyway
        // (cookie might still be valid from a previous session)
        try {
          set({ isLoading: true });

          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include', // Include cookies
          });

          if (!response.ok) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              sessionExpiresAt: null,
              csrfToken: null,
            });
            return false;
          }

          const data = await response.json();

          if (data.success && data.data.authenticated) {
            // Sync CSRF token from cookie
            const csrfToken = getCsrfTokenFromCookie() || state.csrfToken;
            
            set({
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
              sessionExpiresAt: data.data.expiresAt,
              csrfToken,
            });
            return true;
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessionExpiresAt: null,
            csrfToken: null,
          });
          return false;
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            sessionExpiresAt: null,
            csrfToken: null,
          });
          return false;
        }
      },
    }),
    {
      name: "hrflow-session",
      // Only persist user data (for quick UI display), not auth tokens
      partialize: (state) => ({
        user: state.user,
        sessionExpiresAt: state.sessionExpiresAt,
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
 * Helper hook to get CSRF token for API requests
 */
export function useCsrfToken(): string | null {
  const csrfToken = useSessionStore((state) => state.csrfToken);
  
  // Fallback to reading from cookie if not in store
  if (!csrfToken && typeof document !== 'undefined') {
    return getCsrfTokenFromCookie();
  }
  
  return csrfToken;
}

/**
 * Get CSRF token synchronously (for use in apiClient)
 */
export function getCsrfToken(): string | null {
  // First try store
  const state = useSessionStore.getState();
  if (state.csrfToken) {
    return state.csrfToken;
  }
  
  // Fallback to cookie
  return getCsrfTokenFromCookie();
}
