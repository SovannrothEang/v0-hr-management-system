/**
 * Shared Proxy Utility
 * Centralized helper for proxying requests to the external HRMS API.
 * All server-side proxy routes should use EXTERNAL_API_URL (not NEXT_PUBLIC_*).
 */

import { NextResponse } from "next/server";
import type { AuthenticatedRequest } from "@/lib/auth/with-auth";

/** Resolve the external API base URL (server-side only) */
export function getExternalApiUrl(): string {
  return process.env.EXTERNAL_API_URL || "http://localhost:3001/api";
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

    const response = await fetch(url, {
      headers: getAuthHeaders(request),
    });

    console.log(`[Proxy GET] ${externalPath} -> ${response.status}`);

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
 */
export async function proxyMutation(
  request: AuthenticatedRequest,
  method: "POST" | "PUT" | "PATCH",
  externalPath: string,
  errorMessage = "Operation failed"
): Promise<NextResponse> {
  try {
    let body: string | undefined;
    try {
      const json = await request.json();
      body = JSON.stringify(json);
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

    const response = await fetch(`${getExternalApiUrl()}${externalPath}`, {
      method,
      headers,
      body,
    });

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
 */
export async function proxyDelete(
  request: AuthenticatedRequest,
  externalPath: string,
  errorMessage = "Failed to delete"
): Promise<NextResponse> {
  try {
    const response = await fetch(`${getExternalApiUrl()}${externalPath}`, {
      method: "DELETE",
      headers: getAuthHeaders(request),
    });

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

    const response = await fetch(url, {
      headers: getAuthHeaders(request),
    });

    console.log(`[Proxy Export] ${externalPath} -> ${response.status}`);

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
