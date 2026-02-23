import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getExternalApiUrl } from "@/lib/proxy";

export const GET = withAuth(async (request, context) => {
  const { id } = await context?.params!;

  try {
    const response = await fetch(
      `${getExternalApiUrl()}/payrolls/payslip/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to download payslip" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("Content-Type") || "application/pdf";
    const contentDisposition = response.headers.get("Content-Disposition") || `attachment; filename="payslip-${id}.pdf"`;
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to download payslip" },
      { status: 500 }
    );
  }
});
