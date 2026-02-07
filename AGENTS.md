# Agent Guidelines for HR Management System

Guidelines for AI agents working on this Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui project.

## Build, Lint, and Test Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build (includes TypeScript checking)
npm run start            # Start production server
npm run lint             # Run ESLint

# Testing - standalone .mjs files requiring dev server running
node tests/auth.test.mjs            # Auth & RBAC tests (cookie-based auth, CSRF)
node tests/ui-permissions.test.mjs  # UI permission tests
node tests/external-api-auth.test.mjs  # External API authentication tests

# Run specific test
node tests/<filename>.mjs

# Type checking only
npx tsc --noEmit

# Check for unused dependencies (if available)
npx depcheck
```

**Test Users:** `admin@hrflow.com/admin123`, `hr@hrflow.com/hr123`, `sarah.johnson@hrflow.com/emp123`

## Project Structure

```
app/
  (auth)/           # Auth pages (login)
  (dashboard)/      # Protected pages
  api/              # API routes (~30 endpoints)
components/
  auth/             # Auth components (protected-action, session-timeout-warning)
  ui/               # shadcn/ui components
hooks/              # Custom hooks (useAuth, usePermissions)
lib/
  auth/             # Auth utilities (with-auth, with-role, verify-token, token-store)
  constants/        # Constants (roles, permissions)
  session.ts        # Cookie-based session management
  api-client.ts     # Centralized API client with CSRF
stores/             # Zustand stores (session, employee, payroll, attendance)
tests/              # Test files (.mjs)
docs/               # Documentation (BACKEND_API_REQUIREMENTS.md)
```

## Code Style

### Imports (in order)
```typescript
import { NextResponse } from "next/server";      // 1. External packages
import { useState } from "react";                 // 2. React/Next.js
import { apiClient } from "@/lib/api-client";     // 3. Internal (use @/ alias)
import type { User } from "@/stores/session";     // 4. Types last
```

**Important:** Always use `@/` alias for internal imports. Never use relative paths like `../../`.

### TypeScript
- **Explicit types** on function parameters and return values
- **`interface`** for object shapes, **`type`** for unions/aliases
- **`as const`** for constant objects to ensure literal types
- Strict mode enabled (`tsconfig.json`)
- Use `unknown` instead of `any` when type is uncertain
- Use discriminated unions for state management

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `auth-store.ts`, `with-role.ts` |
| Components | PascalCase | `AppSidebar.tsx` |
| Hooks | usePrefix | `usePermissions`, `useAuth` |
| Constants | SCREAMING_SNAKE | `ROLES`, `PERMISSIONS` |
| Functions | camelCase | `generateToken`, `hasPermission` |
| Types/Interfaces | PascalCase | `JWTPayload`, `SessionUser` |
| API Routes | kebab-case | `/api/employees` |

### Error Handling

**API Routes** - consistent JSON structure:
```typescript
return NextResponse.json(
  { success: false, message: "Error description" },
  { status: 500 }
);
```

**Client-side** - use sonner toast:
```typescript
import { toast } from "sonner";
toast.error("Failed to save", { description: error.message });
```

**Try-catch patterns:**
```typescript
try {
  const result = await apiClient.post("/api/endpoint", data);
  return result.data;
} catch (error) {
  console.error("Operation failed:", error);
  toast.error("Operation failed", { description: error.message });
  throw error; // Re-throw if caller needs to handle
}
```

### React Components
```typescript
"use client";  // Add when using hooks/browser APIs

export function MyComponent({ prop }: Props) {
  // 1. Hooks
  const [state, setState] = useState();
  // 2. Derived values
  const computed = useMemo(() => {...}, []);
  // 3. Handlers
  const handleClick = () => {...};
  // 4. Return JSX
  return <div>...</div>;
}
```

**Component file naming:** PascalCase for components, kebab-case for utilities.

### Form Handling with Zod
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { email: "", password: "" },
});
```

### Zustand Store Patterns
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {
  data: string[];
  addData: (item: string) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      data: [],
      addData: (item) => set((state) => ({ data: [...state.data, item] })),
    }),
    { name: "store-name" }
  )
);
```

## Security Patterns (CRITICAL)

### API Route Protection
```typescript
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const POST = withRole(async (request) => {
  const user = request.user;  // Injected by withRole
  // ... handler code
  return NextResponse.json({ success: true, data: result });
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
```

**All API routes MUST use `withAuth` or `withRole`** - no exceptions.

### CSRF Protection
- Mutations (POST/PUT/DELETE) require `X-CSRF-Token` header
- Use `apiClient` which handles CSRF automatically
- CSRF token stored in `csrf_token` cookie (readable by JS)
- Never expose CSRF token in URLs or logs

### Role Checks - NEVER hardcode
```typescript
if (user.role === ROLES.ADMIN) { }     // Good
if (user.role === "admin") { }          // Bad - hardcoded string
```

### UI Protection
```typescript
import { usePermissions } from "@/hooks/use-permissions";
const { isAdmin, isHrManager } = usePermissions();
{isAdmin && <AdminButton />}
```

### Audit Logging
```typescript
import { logAuditEvent, AuditAction } from "@/lib/audit-log";
logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, user, {
  ipAddress, userAgent, details: { payrollIds }
});
```

**Always log sensitive actions** (user creation, deletion, payroll changes, etc.)

### Rate Limiting
```typescript
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
const rateLimit = checkRateLimit(clientId, RateLimitPresets.AUTH);
if (!rateLimit.allowed) {
  return NextResponse.json({ success: false, message: "Rate limited" }, { status: 429 });
}
```

## Common Patterns

### API Client (handles cookies + CSRF)
```typescript
import { apiClient } from "@/lib/api-client";
const { data } = await apiClient.post<ResponseType>("/api/endpoint", body);
```

**Note:** The apiClient automatically handles:
- CSRF token for mutations
- Session refresh on 401 errors
- Cookie-based authentication
- Error handling with toast notifications

### Authentication Flow
```typescript
// Login
const { mutate: login } = useLogin();
login({ email, password });

// Logout
const { mutate: logout } = useLogout();
logout();

// Check session (automatic on app load)
const { checkSession } = useSessionStore();
```

### Permission Checks
```typescript
import { usePermissions } from "@/hooks/use-permissions";

const { 
  isAdmin, 
  isHRManager, 
  can: { viewAllEmployees, createEmployee } 
} = usePermissions();

// In JSX
{can.viewAllEmployees && <EmployeeList />}
```

### Form Submission
```typescript
const { mutate: submit, isPending } = useMutation({
  mutationFn: async (data: FormData) => {
    return await apiClient.post("/api/endpoint", data);
  },
  onSuccess: () => {
    toast.success("Success");
  },
  onError: (error) => {
    toast.error("Failed", { description: error.message });
  },
});
```

## Testing Guidelines

### Test Files Location
- Tests are in `/tests/` directory
- Files are `.mjs` (ES modules)
- Tests require dev server to be running

### Running Tests
```bash
# Run all tests
node tests/auth.test.mjs
node tests/ui-permissions.test.mjs

# Run specific test file
node tests/<filename>.mjs
```

### Test Structure
```javascript
// Example test structure
const test = async () => {
  console.log("Running test...");
  
  // 1. Setup
  // 2. Execute action
  // 3. Assert result
  // 4. Cleanup
};

test().catch(console.error);
```

### Test Users
- Admin: `admin@hrflow.com/admin123`
- HR Manager: `hr@hrflow.com/hr123`
- Employee: `sarah.johnson@hrflow.com/emp123`

## Authentication Architecture

- **Cookie-based JWT** with httpOnly cookies (`auth_token`, `refresh_token`)
- **CSRF protection** via `csrf_token` cookie + `X-CSRF-Token` header
- **Refresh token rotation** with reuse detection (see `lib/auth/token-store.ts`)
- **Session validation** via `GET /api/auth/session`
- **Token expiration**: Access token (24h), Refresh token (7 days)

## Key Rules

1. **All API routes MUST use `withAuth` or `withRole`** - no exceptions
2. **Always validate input** with Zod schemas
3. **Log sensitive actions** via audit logging
4. **Never expose internal errors** to users
5. **Use `@/` imports** - never relative paths like `../../`
6. **Defense in depth** - protect both backend AND frontend
7. **Rate limit** auth and sensitive endpoints
8. **Never commit secrets** - use environment variables
9. **TypeScript strict mode** - no `any` types
10. **Follow naming conventions** - consistency is key

## API Alignment Guidelines

### Current Architecture
- **Next.js API Routes** running on the same server as frontend
- **Cookie-based authentication** with httpOnly cookies
- **CSRF protection** via X-CSRF-Token header
- **Mock data** in `lib/mock-data.ts` (replace with real database as needed)

### Response Format Standards

**Success Response:**
```typescript
{
  success: true;
  data: T;  // The actual data
  meta?: {  // For list endpoints with pagination
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

**Error Response:**
```typescript
{
  success: false;
  message: string;  // Human-readable error message
  // Optional additional fields for specific errors
  required?: string[];  // For permission errors
  current?: string[];   // For permission errors
}
```

### Data Model Naming Conventions

**Employee Model:**
- Use `employeeId` (not `employeeCode`)
- Use `firstName` and `lastName` (not `firstname`, `lastname`)
- Use `phone` (not `phoneNumber`)
- Use `avatar` (not `profileImage`)
- Use `department` and `position` as strings (not objects)
- Employment type: `full_time`, `part_time`, `contract`, `intern` (lowercase)
- Status: `active`, `on_leave`, `terminated`, `probation`, `inactive` (lowercase)

**Attendance Model:**
- Use `clockIn` and `clockOut` (not `checkInTime`, `checkOutTime`)
- Status: `present`, `late`, `absent`, `half_day`, `on_leave` (lowercase)

**Payroll Model:**
- Status: `pending`, `processed`, `paid` (lowercase)

### API Endpoints

**Employee Endpoints:**
- `GET /api/employees` - List with search, department, status filters
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee

**Attendance Endpoints:**
- `GET /api/attendances` - List with search, date, status filters
- `POST /api/attendances/clock-in` - Clock in
- `POST /api/attendances/clock-out` - Clock out

**Audit Logs:**
- `GET /api/audit-logs` - List with filters (limit, offset, userId, action, severity, dates)

**Payroll Endpoints:**
- `GET /api/payrolls` - List with filters
- `GET /api/payrolls/summary` - Summary statistics
- `POST /api/payrolls/generate` - Generate payroll
- `POST /api/payrolls/mark-paid` - Mark payrolls as paid

**Reports Endpoints:**
- `GET /api/reports/employee` - Employee statistics
- `GET /api/reports/employee/export` - Export employee data (CSV/XLSX)
- `GET /api/reports/payrolls` - Payroll report
- `GET /api/reports/payrolls/export` - Export payroll data (CSV/XLSX)
- `GET /api/reports/comprehensive` - Dashboard data
- `GET /api/reports/attendances` - Attendance report
- `GET /api/reports/leave` - Leave request report

### Authentication Endpoints
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh session
- `GET /api/auth/session` - Validate session

### Important Notes

1. **Environment Variables:**
   - `NEXT_PUBLIC_API_BASE_URL` - API base URL (defaults to `/api`)
   - `JWT_SECRET` - Server-side JWT secret
   - `JWT_REFRESH_SECRET` - Server-side refresh token secret

2. **CSRF Protection:**
   - All state-changing requests (POST, PUT, PATCH, DELETE) require `X-CSRF-Token` header
   - Use `apiClient` which handles CSRF automatically

3. **Pagination:**
   - List endpoints support `page` and `limit` query parameters
   - Response includes `meta` object with pagination info

4. **Error Handling:**
   - Always return consistent JSON structure
   - Use `success: false` for errors
   - Include descriptive `message` field

5. **Testing:**
   - Tests require dev server to be running
   - Use test users: `admin@hrflow.com/admin123`, `hr@hrflow.com/hr123`, `sarah.johnson@hrflow.com/emp123`

6. **Adding New Features:**
   - Check existing patterns before implementing
   - Follow naming conventions strictly
   - Update FRONTEND_INTEGRATION.md when adding new endpoints
   - Add TypeScript interfaces for new data models

## Environment Variables

The project uses `.env.development` for local development. Required variables:
- `JWT_SECRET` - For token signing
- `JWT_REFRESH_SECRET` - For refresh token signing

**Never commit `.env` files** to version control.

## Common Issues & Solutions

### TypeScript Errors
```bash
# Check types without building
npx tsc --noEmit
```

### ESLint Errors
```bash
# Run linter
npm run lint

# Auto-fix where possible
npm run lint -- --fix
```

### Build Errors
- Check for unused imports
- Verify all types are properly defined
- Ensure `@/` imports are correct
- Check for circular dependencies

### Runtime Errors
- Check browser console for errors
- Verify API endpoints are correct
- Check network tab for failed requests
- Verify authentication cookies are present

## Performance Considerations

- Use React Query for data fetching and caching
- Implement proper loading states
- Avoid unnecessary re-renders (use React.memo where appropriate)
- Lazy load heavy components
- Optimize images using Next.js Image component

## Deployment Checklist

1. ✅ Run `npm run build` to verify production build
2. ✅ Run `npm run lint` to check for code quality issues
3. ✅ Run `npx tsc --noEmit` to verify TypeScript types
4. ✅ Test authentication flow
5. ✅ Verify all API endpoints work
6. ✅ Check environment variables are set
7. ✅ Review security headers in `next.config.mjs`

---

*Last updated: January 27, 2026*