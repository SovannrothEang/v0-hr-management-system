/**
 * Image Proxy Endpoint
 * Proxies image requests to the external HRMS API backend.
 * This prevents exposing the backend root URL to the browser.
 *
 * Usage: /api/images/<relative-path>
 * e.g.  /api/images/uploads/employees/avatar-123.jpg
 */

import { NextRequest, NextResponse } from "next/server";

/** Resolve the external backend root URL (server-side only) */
function getBackendRoot(): string {
  // Strip trailing /api from EXTERNAL_API_URL if present, or use dedicated var
  const externalApi = process.env.EXTERNAL_API_URL || "http://localhost:3001/api";
  return externalApi.replace(/\/api\/?$/, "");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    const { path } = await context.params;
    const relativePath = path.join("/");

    if (!relativePath) {
      return NextResponse.json(
        { success: false, message: "Image path is required" },
        { status: 400 }
      );
    }

    const backendUrl = `${getBackendRoot()}/${relativePath}`;

    const response = await fetch(backendUrl);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Image not found" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const body = await response.arrayBuffer();

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[Image Proxy]", error);
    return NextResponse.json(
      { success: false, message: "Failed to load image" },
      { status: 500 }
    );
  }
}
