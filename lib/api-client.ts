/**
 * API Client
 * Handles all API requests with Bearer token authentication
 * Access token is stored in memory (React state) for security
 * CSRF token is stored in memory for state-changing requests
 * Implements automatic token refresh with proper cookie management
 */

import { getAccessToken, getCsrfToken, getSessionId, useSessionStore } from "@/stores/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  CSRF_TOKEN: 'csrf_token',
  SESSION_STORE: 'hrflow-session',
};

function requiresCsrf(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return !safeMethods.includes(method.toUpperCase());
}

function clearAllSessionCookies(): void {
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

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  
  clearAllSessionCookies();
  useSessionStore.getState().clearSession();
  
  const loginUrl = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  window.location.href = loginUrl;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async refreshSession(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          console.log('[ApiClient] Refresh failed with status:', response.status);
          return false;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          const { accessToken, csrfToken, expiresAt, user, externalAccessToken, sessionId } = data.data;
          
          if (accessToken) {
            const currentUser = useSessionStore.getState().user;
            const existingSessionId = useSessionStore.getState().sessionId;
            useSessionStore.getState().setSession(
              user || currentUser!,
              expiresAt || Date.now() + 24 * 60 * 60 * 1000,
              csrfToken || '',
              accessToken,
              sessionId || existingSessionId || undefined
            );
            
            if (externalAccessToken) {
              useSessionStore.getState().setSession(
                { ...useSessionStore.getState().user!, externalAccessToken } as any,
                useSessionStore.getState().sessionExpiresAt!,
                useSessionStore.getState().csrfToken!,
                accessToken,
                useSessionStore.getState().sessionId || undefined
              );
            }
            
            console.log('[ApiClient] Token refreshed successfully');
            return true;
          }
        }
        
        console.log('[ApiClient] Refresh response missing accessToken');
        return false;
      } catch (error) {
        console.error('[ApiClient] Refresh error:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options?.method || 'GET';
    
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string>),
    };
    
    if (!(options?.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    
    const accessToken = getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    if (requiresCsrf(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }
      const sessionId = getSessionId();
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      console.log(`[ApiClient] CSRF headers for ${method} ${endpoint}:`, {
        hasCsrfToken: !!csrfToken,
        hasSessionId: !!sessionId,
        csrfToken: csrfToken ? `${csrfToken.substring(0, 8)}...` : null,
        sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null,
      });
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = typeof error.message === 'object' && error.message !== null
        ? (error.message as any).message 
        : error.message;
      
      if (response.status === 401) {
        console.log('[ApiClient] Got 401, retryCount:', retryCount);
        
        if (retryCount === 0 && typeof window !== 'undefined') {
          console.log('[ApiClient] Attempting token refresh...');
          
          try {
            const refreshed = await this.refreshSession();
            console.log('[ApiClient] Refresh result:', refreshed);
            
            if (refreshed) {
              const newAccessToken = getAccessToken();
              if (newAccessToken) {
                headers['Authorization'] = `Bearer ${newAccessToken}`;
              }
              
              const newCsrfToken = getCsrfToken();
              if (newCsrfToken && requiresCsrf(method)) {
                headers['x-csrf-token'] = newCsrfToken;
              }

              const newSessionId = getSessionId();
              if (newSessionId && requiresCsrf(method)) {
                headers['x-session-id'] = newSessionId;
              }
              
              console.log('[ApiClient] Retrying request with new token...');
              
              const retryResponse = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
              });
              
              if (retryResponse.ok) {
                if (retryResponse.status === 204) {
                  return { data: null as T, success: true };
                }
                const retryText = await retryResponse.text();
                if (!retryText) {
                  return { data: null as T, success: true };
                }
                return JSON.parse(retryText) as ApiResponse<T>;
              }
              
              if (retryResponse.status === 401) {
                console.log('[ApiClient] Retry still got 401, redirecting to login');
                redirectToLogin();
                throw new Error('Session expired');
              }
              
              const retryError = await retryResponse.json().catch(() => ({}));
              throw new Error(retryError.message || `HTTP error! status: ${retryResponse.status}`);
            } else {
              console.log('[ApiClient] Refresh failed, redirecting to login');
            }
          } catch (err) {
            console.log('[ApiClient] Refresh exception:', err);
            if (err instanceof Error && err.message === 'Session expired') {
              throw err;
            }
          }
        }
        
        redirectToLogin();
        throw new Error('Session expired');
      }
      
      if (response.status === 403) {
        throw new Error(errorMessage || 'You do not have permission to perform this action');
      }
      
      throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return { data: null as T, success: true };
    }

    const responseText = await response.text();
    if (!responseText) {
      return { data: null as T, success: true };
    }

    return JSON.parse(responseText) as ApiResponse<T>;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  }

  getImageUrl(relativePath?: string | null): string | undefined {
    if (!relativePath) return undefined;
    if (relativePath.startsWith('http')) return relativePath;

    const cleanPath = relativePath.replace(/^\/+/, '');
    return `/api/images/${cleanPath}`;
  }

  logout(): void {
    redirectToLogin();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
