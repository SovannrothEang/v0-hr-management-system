import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { ROLES, hasRole } from "@/lib/constants/roles";

export const GET = withAuth(async (
  request,
  context
) => {
  const { id } = await context?.params!;
  
  // Authorization check: Admin, HR Manager, or self
  const isSelf = request.user.employeeId === id;
  const isAuthorized = isSelf || hasRole(request.user.roles, [ROLES.ADMIN, ROLES.HR_MANAGER]);

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, message: "Unauthorized to view this record" },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/employees/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Use data.data if it exists (from NestJS TransformInterceptor)
    const result = data.data !== undefined ? data.data : data;
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;
    
    // PUT usually replaces the whole resource, restricted to HR/Admin
    if (!hasRole(request.user.roles, [ROLES.ADMIN, ROLES.HR_MANAGER])) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to perform full update" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/employees/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to update employee" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Use data.data if it exists (from NestJS TransformInterceptor)
    const result = data.data !== undefined ? data.data : data;
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update employee" },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;
    
    // Authorization check: Admin, HR Manager, or self
    const isSelf = request.user.employeeId === id;
    const isAuthorized = isSelf || hasRole(request.user.roles, [ROLES.ADMIN, ROLES.HR_MANAGER]);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to update this record" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // If not Admin/HR, restrict which fields can be updated
    if (!hasRole(request.user.roles, [ROLES.ADMIN, ROLES.HR_MANAGER])) {
      // List of allowed fields for self-update
      const allowedFields = ['firstName', 'lastName', 'phone', 'personalEmail', 'address', 'emergencyContact'];
      const filteredBody: any = {};
      
      Object.keys(body).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredBody[key] = body[key];
        }
      });
      
      if (Object.keys(filteredBody).length === 0) {
        return NextResponse.json(
          { success: false, message: "No valid fields provided for update" },
          { status: 400 }
        );
      }
      
      // Use filteredBody for non-privileged users
      body.data = filteredBody; // Assuming the backend might need them wrapped or just the body
      // Actually, let's just use filteredBody as the body
    }

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/employees/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
        body: JSON.stringify(!hasRole(request.user.roles, [ROLES.ADMIN, ROLES.HR_MANAGER]) ? 
          Object.keys(body).reduce((acc: any, key) => {
            const allowed = ['firstName', 'lastName', 'phone', 'personalEmail', 'address', 'emergencyContact'];
            if (allowed.includes(key)) acc[key] = body[key];
            return acc;
          }, {}) : body),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to update employee" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Use data.data if it exists (from NestJS TransformInterceptor)
    const result = data.data !== undefined ? data.data : data;
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update employee" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (
  request,
  context
) => {
  const { id } = await context?.params!;

  // DELETE is strictly for Admin/HR
  if (!hasRole(request.user.roles, [ROLES.ADMIN, ROLES.HR_MANAGER])) {
    return NextResponse.json(
      { success: false, message: "Unauthorized to delete records" },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(
      `${process.env.EXTERNAL_API_URL || 'http://localhost:3001/api'}/employees/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${request.user.externalAccessToken || ''}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to delete employee" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to delete employee" },
      { status: 500 }
    );
  }
});
