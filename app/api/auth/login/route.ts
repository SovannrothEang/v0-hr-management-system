import { NextResponse } from "next/server";
import { generateToken } from "@/lib/auth/verify-token";
import { ROLES } from "@/lib/constants/roles";

const mockUsers = [
  {
    id: "admin-1",
    email: "admin@hrflow.com",
    password: "admin123",
    name: "Admin User",
    role: ROLES.ADMIN,
    department: "Administration",
  },
  {
    id: "hr-1",
    email: "hr@hrflow.com",
    password: "hr123",
    name: "Emily Rodriguez",
    role: ROLES.HR_MANAGER,
    department: "Human Resources",
    employeeId: "EMP003",
  },
  {
    id: "emp-1",
    email: "sarah.johnson@hrflow.com",
    password: "emp123",
    name: "Sarah Johnson",
    role: ROLES.EMPLOYEE,
    department: "Engineering",
    employeeId: "EMP001",
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { password: _, ...userWithoutPassword } = user;
    
    // Generate real JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
