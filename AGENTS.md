# Agent Guidelines for HR Management System

This document provides essential guidelines for AI agents working on this Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui project.

## 🛠️ Commands (Build, Lint, Test)

```bash
# Development & Build
npm run dev              # Start dev server (required for running tests!)
npm run build            # Production build (includes TypeScript checking)
npm run lint             # Run ESLint
npx tsc --noEmit         # Type checking only

# Testing (Tests are standalone .mjs files. Dev server MUST be running)
node tests/auth.test.mjs            # Run auth/RBAC tests
node tests/ui-permissions.test.mjs  # Run UI permission tests

# Run a specific single test
node tests/<filename>.mjs

# Common Test Users: 
# admin@hrflow.com / admin123 (Admin)
# hr@hrflow.com / hr123 (HR Manager)
# sarah.johnson@hrflow.com / emp123 (Employee)
```

## 🏗️ Project Structure Highlights
- `app/api/`: API routes (MUST be protected).
- `components/ui/`: shadcn/ui components.
- `lib/auth/`: Auth utilities (`with-auth.ts`, `with-role.ts`, `api-client.ts`).
- `stores/`: Zustand state management.
- `tests/`: Standalone `.mjs` test files.

## ✍️ Code Style & Guidelines

### 1. Imports
- **Order**: External packages -> React/Next.js -> Internal imports -> Types.
- **Alias**: ALWAYS use `@/` for internal imports. NEVER use relative paths (`../../`).

### 2. TypeScript
- **Strict Typing**: Use explicit types on function parameters and return values. NO `any` (use `unknown` instead).
- **Types/Interfaces**: Use `interface` for object shapes, `type` for unions/aliases. Use `as const` for literal constant objects.

### 3. Naming Conventions
- **Files**: `kebab-case` (e.g., `auth-store.ts`, `/api/employees`).
- **Components**: `PascalCase` (e.g., `AppSidebar.tsx`).
- **Hooks**: `useCamelCase` (e.g., `usePermissions`).
- **Constants**: `SCREAMING_SNAKE` (e.g., `ROLES`).
- **Types/Interfaces**: `PascalCase` (e.g., `SessionUser`).
- **Functions**: `camelCase` (e.g., `generateToken`).

### 4. Data Model Standards
- **Employee**: `employeeId` (not `employeeCode`), `firstName`, `lastName`, `phone`, `avatar`. `department` and `position` are strings. 
- **Enums**: Always lowercase.
  - Employment: `full_time`, `part_time`, `contract`, `intern`.
  - Status: `active`, `on_leave`, `terminated`, `probation`, `inactive`.
- **Attendance**: `clockIn`, `clockOut`. Statuses: `present`, `late`, `absent`, `half_day`, `on_leave`.
- **Payroll**: Statuses: `pending`, `processed`, `paid`.

### 5. Error Handling & API Responses
- **API Responses**: Always return a consistent JSON structure:
  ```typescript
  // Success
  return NextResponse.json({ success: true, data: result, meta?: { total, page, limit } });
  // Error
  return NextResponse.json({ success: false, message: "Error description" }, { status: 500 });
  ```
- **Client-Side Errors**: Use `toast.error` from `sonner` in catch blocks. Never expose raw backend errors to the UI.
- Use `try/catch` with `apiClient` for data fetching.

### 6. Client Components & Forms
- Add `"use client";` at the top of components using hooks or browser APIs.
- Form Handling: Use `react-hook-form` + `@hookform/resolvers/zod` + `zod` for validation.
- Zustand Stores: Use `create<State>()(persist(...))` for state that needs to be persisted.

## 🔒 Security & Architecture (CRITICAL)

### 1. Route Protection
- **ALL** API routes must be protected using `withAuth` or `withRole`:
  ```typescript
  import { withRole } from "@/lib/auth/with-role";
  import { ROLES } from "@/lib/constants/roles";
  
  export const POST = withRole(async (request) => {
    const user = request.user; // Injected
    return NextResponse.json({ success: true, data: result });
  }, [ROLES.ADMIN, ROLES.HR_MANAGER]);
  ```
- **NEVER** hardcode roles like `if (user.role === 'admin')`. Use `ROLES.ADMIN`.
- **UI Protection**: Use `const { isAdmin, can } = usePermissions();` to conditionally render elements.

### 2. Auth & CSRF
- **Authentication**: Uses HttpOnly cookies (`auth_token`, `refresh_token`).
- **CSRF**: `apiClient` automatically attaches `X-CSRF-Token` headers for mutations (POST/PUT/DELETE) using the `csrf_token` cookie. ALWAYS use `apiClient` for client requests, not raw fetch!

### 3. Audit Logging
- Always log sensitive actions (user creation/deletion, payroll changes, permissions updates):
  ```typescript
  import { logAuditEvent, AuditAction } from "@/lib/audit-log";
  logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, request.user, { details: { id } });
  ```

### 4. Rate Limiting
- Use `checkRateLimit` on auth and sensitive endpoints.

### 5. Environment Variables
- `JWT_SECRET` and `JWT_REFRESH_SECRET` are required.
- **NEVER commit `.env` files.**
