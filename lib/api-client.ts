/**
 * API Client
 * Handles all API requests with Bearer token authentication
 * Access token is stored in memory (React state) for security
 * CSRF token is stored in memory for state-changing requests
 */

import { getAccessToken, getCsrfToken } from "@/stores/session";

// Get API base URL from environment variable
// Falls back to "/api" for backward compatibility with Next.js API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Check if the request method requires CSRF token
 */
function requiresCsrf(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return !safeMethods.includes(method.toUpperCase());
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Attempt to refresh the session
   */
  private async refreshSession(): Promise<boolean> {
    // If already refreshing, return the existing promise
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
          return false;
        }

        const data = await response.json();
        if (data.success && data.data?.accessToken) {
          // Update access token in store
          const { useSessionStore } = await import("@/stores/session");
          useSessionStore.getState().setAccessToken(data.data.accessToken);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options?.method || 'GET';
    
    // Build headers
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string>),
    };
    
    // Default to JSON if not FormData
    if (!(options?.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    
    // Add Bearer token for authenticated requests
    const accessToken = getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Add CSRF token for state-changing requests
    if (requiresCsrf(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      // Handle 401 - session expired, try to refresh
      if (response.status === 401 && retryCount === 0) {
        if (typeof window !== 'undefined') {
          try {
            // Try to refresh the session
            const refreshed = await this.refreshSession();
            if (refreshed) {
              // Retry the request with new session
              return this.request<T>(endpoint, options, retryCount + 1);
            }
          } catch {
            // Refresh failed
          }
          
          // Redirect to login if refresh failed
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }
      
      // Handle 403 - permission denied or invalid CSRF
      if (response.status === 403) {
        throw new Error(error.message || 'You do not have permission to perform this action');
      }
      
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
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

  /**
   * Get full URL for an image relative path.
   * Routes through the Next.js image proxy (/api/images/...) to avoid
   * exposing the external backend URL to the browser.
   */
  getImageUrl(relativePath?: string | null): string | undefined {
    if (!relativePath) return undefined;
    if (relativePath.startsWith('http')) return relativePath;

    // Strip leading slash to avoid double-slashes
    const cleanPath = relativePath.replace(/^\/+/, '');
    return `/api/images/${cleanPath}`;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
