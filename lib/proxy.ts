/**
 * Shared Proxy Utility
 * Centralized helper for proxying requests to the external HRMS API.
 * All server-side proxy routes should use EXTERNAL_API_URL (not NEXT_PUBLIC_*).
 * Automatically refreshes expired external tokens and retries requests.
 */

import { NextResponse } from "next/server";
import type { AuthenticatedRequest } from "@/lib/auth/with-auth";

/** Resolve the external API base URL (server-side only) */
export function getExternalApiUrl(): string {
  return process.env.EXTERNAL_API_URL || "http://localhost:3001/api";
}

/**
 * Refresh the external API token using the stored external refresh token
 * @param request - The authenticated request with external tokens
 * @returns New external access token or null if refresh failed
 */
async function refreshExternalToken(
  request: AuthenticatedRequest
): Promise<string | null> {
  try {
    const externalRefreshToken = request.user.externalRefreshToken;

    if (!externalRefreshToken) {
      console.log('[Proxy] No external refresh token available');
      return null;
    }

    console.log('[Proxy] Attempting to refresh external token...');

    const response = await fetch(`${getExternalApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refresh_token=${externalRefreshToken}`,
      },
    });

    if (!response.ok) {
      console.log(`[Proxy] External token refresh failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.data?.accessToken || data.accessToken;
    const newRefreshToken = data.data?.refreshToken || data.refreshToken;

    if (newAccessToken) {
      console.log('[Proxy] External token refreshed successfully');
      // Update the request object with new token
      request.user.externalAccessToken = newAccessToken;
      if (newRefreshToken) {
        request.user.externalRefreshToken = newRefreshToken;
      }
      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error('[Proxy] Error refreshing external token:', error);
    return null;
  }
}

/** Build Authorization header from the authenticated request */
function getAuthHeaders(request: AuthenticatedRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${request.user.externalAccessToken || ""}`,
  };

  const csrfToken = request.headers.get("x-csrf-token");
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const sessionId = request.headers.get("x-session-id");
  if (sessionId) {
    headers["x-session-id"] = sessionId;
  }

  return headers;
}

interface ProxyGetOptions {
  /** Extra query params to append */
  extraParams?: Record<string, string>;
}

/**
 * Proxy a GET request to the external API.
 * Forwards query params and the user's external access token.
 * Automatically retries with refreshed token on 401.
 */
export async function proxyGet(
  request: AuthenticatedRequest,
  externalPath: string,
  errorMessage = "Failed to fetch data",
  options?: ProxyGetOptions
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams(searchParams.toString());

    if (options?.extraParams) {
      for (const [k, v] of Object.entries(options.extraParams)) {
        if (!params.has(k)) params.set(k, v);
      }
    }

    const qs = params.toString();
    const url = `${getExternalApiUrl()}${externalPath}${qs ? `?${qs}` : ""}`;

    console.log(`[Proxy GET] ${url}`);

    let response = await fetch(url, {
      headers: getAuthHeaders(request),
    });

    console.log(`[Proxy GET] ${externalPath} -> ${response.status}`);

    // If external token expired, try to refresh and retry
    if (response.status === 401) {
      console.log(`[Proxy GET] Received 401, attempting external token refresh...`);
      const newToken = await refreshExternalToken(request);

      if (newToken) {
        console.log(`[Proxy GET] Retrying with refreshed token...`);
        response = await fetch(url, {
          headers: getAuthHeaders(request),
        });
        console.log(`[Proxy GET] Retry result: ${response.status}`);
      } else {
        console.log(`[Proxy GET] External token refresh failed, returning 401`);
        return NextResponse.json(
          { success: false, message: "External session expired" },
          { status: 401 }
        );
      }
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error(`[Proxy GET] ${externalPath} error:`, errBody);
      return NextResponse.json(
        { success: false, message: errBody.message || errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.data !== undefined ? data.data : data;

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(`[Proxy GET ${externalPath}]`, error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Proxy a mutation request (POST / PUT / PATCH) with a JSON body.
 * Automatically retries with refreshed token on 401.
 */
export async function proxyMutation(
  request: AuthenticatedRequest,
  method: "POST" | "PUT" | "PATCH",
  externalPath: string,
  errorMessage = "Operation failed"
): Promise<NextResponse> {
  try {
    let body: string | undefined;
    let bodyJson: unknown;
    try {
      bodyJson = await request.json();
      body = JSON.stringify(bodyJson);
    } catch {
      // No body (e.g. POST with no payload)
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...getAuthHeaders(request),
    };

    console.log(`[Proxy ${method}] ${externalPath}`, {
      authHeaders: Object.keys(headers),
      hasCsrf: !!headers["x-csrf-token"],
      hasSession: !!headers["x-session-id"],
    });

    let response = await fetch(`${getExternalApiUrl()}${externalPath}`, {
      method,
      headers,
      body,
    });

    // If external token expired, try to refresh and retry
    if (response.status === 401) {
      console.log(`[Proxy ${method}] Received 401, attempting external token refresh...`);
      const newToken = await refreshExternalToken(request);

      if (newToken) {
        console.log(`[Proxy ${method}] Retrying with refreshed token...`);
        // Update headers with new token
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${getExternalApiUrl()}${externalPath}`, {
          method,
          headers,
          body,
        });
        console.log(`[Proxy ${method}] Retry result: ${response.status}`);
      } else {
        console.log(`[Proxy ${method}] External token refresh failed, returning 401`);
        return NextResponse.json(
          { success: false, message: "External session expired" },
          { status: 401 }
        );
      }
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errBody.message || errorMessage },
        { status: response.status }
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return NextResponse.json({ success: true, data: null });
    }

    const data = await response.json();
    const result = data.data !== undefined ? data.data : data;

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(`[Proxy ${method} ${externalPath}]`, error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Proxy a DELETE request.
 * Automatically retries with refreshed token on 401.
 */
export async function proxyDelete(
  request: AuthenticatedRequest,
  externalPath: string,
  errorMessage = "Failed to delete"
): Promise<NextResponse> {
  try {
    let response = await fetch(`${getExternalApiUrl()}${externalPath}`, {
      method: "DELETE",
      headers: getAuthHeaders(request),
    });

    // If external token expired, try to refresh and retry
    if (response.status === 401) {
      console.log(`[Proxy DELETE] Received 401, attempting external token refresh...`);
      const newToken = await refreshExternalToken(request);

      if (newToken) {
        console.log(`[Proxy DELETE] Retrying with refreshed token...`);
        response = await fetch(`${getExternalApiUrl()}${externalPath}`, {
          method: "DELETE",
          headers: getAuthHeaders(request),
        });
        console.log(`[Proxy DELETE] Retry result: ${response.status}`);
      } else {
        console.log(`[Proxy DELETE] External token refresh failed, returning 401`);
        return NextResponse.json(
          { success: false, message: "External session expired" },
          { status: 401 }
        );
      }
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errBody.message || errorMessage },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error(`[Proxy DELETE ${externalPath}]`, error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Proxy a file/stream export request.
 * Forwards the response as-is (for CSV/XLSX downloads from external API).
 * Automatically retries with refreshed token on 401.
 */
export async function proxyExport(
  request: AuthenticatedRequest,
  externalPath: string,
  errorMessage = "Export failed"
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const url = `${getExternalApiUrl()}${externalPath}${qs ? `?${qs}` : ""}`;

    console.log(`[Proxy Export] ${url}`);

    let response = await fetch(url, {
      headers: getAuthHeaders(request),
    });

    console.log(`[Proxy Export] ${externalPath} -> ${response.status}`);

    // If external token expired, try to refresh and retry
    if (response.status === 401) {
      console.log(`[Proxy Export] Received 401, attempting external token refresh...`);
      const newToken = await refreshExternalToken(request);

      if (newToken) {
        console.log(`[Proxy Export] Retrying with refreshed token...`);
        response = await fetch(url, {
          headers: getAuthHeaders(request),
        });
        console.log(`[Proxy Export] Retry result: ${response.status}`);
      } else {
        console.log(`[Proxy Export] External token refresh failed, returning 401`);
        return NextResponse.json(
          { success: false, message: "External session expired" },
          { status: 401 }
        );
      }
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error(`[Proxy Export] ${externalPath} error:`, errBody);
      return NextResponse.json(
        { success: false, message: errBody.message || errorMessage },
        { status: response.status }
      );
    }

    // Forward the response as-is (binary stream for file downloads)
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition");
    const body = await response.arrayBuffer();

    const headers: Record<string, string> = {
      "Content-Type": contentType,
    };
    if (contentDisposition) {
      headers["Content-Disposition"] = contentDisposition;
    }

    return new NextResponse(new Uint8Array(body), { status: 200, headers });
  } catch (error) {
    console.error(`[Proxy Export ${externalPath}]`, error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
