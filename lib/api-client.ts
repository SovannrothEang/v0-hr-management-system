const API_BASE_URL = "/api";

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    // Get token from localStorage (Zustand persists it there)
    if (typeof window === 'undefined') return null;
    
    try {
      const authStore = localStorage.getItem('hrflow-auth');
      if (!authStore) return null;
      
      const parsed = JSON.parse(authStore);
      return parsed?.state?.token || null;
    } catch {
      return null;
    }
  }

  private getRefreshToken(): string | null {
    // Get refresh token from localStorage
    if (typeof window === 'undefined') return null;
    
    try {
      const authStore = localStorage.getItem('hrflow-auth');
      if (!authStore) return null;
      
      const parsed = JSON.parse(authStore);
      return parsed?.state?.refreshToken || null;
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        
        if (data.success && data.data.token && data.data.refreshToken) {
          // Update tokens in localStorage
          const authStore = localStorage.getItem('hrflow-auth');
          if (authStore) {
            const parsed = JSON.parse(authStore);
            parsed.state.token = data.data.token;
            parsed.state.refreshToken = data.data.refreshToken;
            localStorage.setItem('hrflow-auth', JSON.stringify(parsed));
          }
          
          return data.data.token;
        }

        throw new Error('Invalid refresh response');
      } catch (error) {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem('hrflow-auth');
        window.location.href = '/login';
        throw error;
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
    
    // Get auth token and add to headers
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      // Handle 401 - token expired, try to refresh
      if (response.status === 401 && retryCount === 0) {
        if (typeof window !== 'undefined') {
          try {
            // Try to refresh the token
            await this.refreshAccessToken();
            // Retry the request with new token
            return this.request<T>(endpoint, options, retryCount + 1);
          } catch {
            // Refresh failed, redirect to login
            localStorage.removeItem('hrflow-auth');
            window.location.href = '/login';
          }
        }
      }
      
      // Handle 403 - permission denied
      if (response.status === 403) {
        if (typeof window !== 'undefined') {
          // Show error message (toast will be shown by the calling code)
          throw new Error(error.message || 'You do not have permission to perform this action');
        }
      }
      
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
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

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
