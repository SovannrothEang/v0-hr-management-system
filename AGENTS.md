# Agent Guidelines for HR Management System

This document provides coding standards and guidelines for AI agents working on this Next.js 16 HR Management System with TypeScript, Tailwind CSS v4, and shadcn/ui.

## Build, Lint, and Test Commands

```bash
# Development
npm run dev                    # Start dev server on http://localhost:3000
npm run build                  # Production build
npm run start                  # Start production server
npm run lint                   # Run ESLint

# Testing (standalone .mjs files in /tests directory)
node tests/auth.test.mjs                  # Run backend auth tests (requires dev server)
node tests/ui-permissions.test.mjs        # Run UI permissions tests (requires dev server)

# Run specific test file
node tests/[filename].mjs                 # Replace with specific test file
```

## Project Structure

```
app/
  (auth)/          # Auth-related pages (login)
  (dashboard)/     # Protected dashboard pages
  api/             # API routes (27 endpoints)
components/
  auth/            # Authentication components (protected-action, session-timeout-warning)
  ui/              # shadcn/ui components
hooks/             # Custom React hooks (useAuth, usePermissions, etc.)
lib/
  auth/            # Authentication utilities (with-auth, with-role, verify-token)
  constants/       # Constants (roles, permissions)
  rate-limit.ts    # Rate limiting utility
  audit-log.ts     # Audit logging infrastructure
stores/            # Zustand state management (auth, employee, payroll, attendance)
tests/             # Test files (.mjs)
```

## Code Style Guidelines

### Imports

**Order:** External packages → Next.js/React → Internal absolute imports → Types
```typescript
import { NextResponse } from "next/server";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import type { User, UserRole } from "@/stores/auth-store";
```

**Use `@/` for absolute imports** (configured in tsconfig.json):
```typescript
import { ROLES } from "@/lib/constants/roles";  // ✅ Good
import { ROLES } from "../../lib/constants/roles";  // ❌ Bad
```

### TypeScript

**Always use explicit types** for function parameters and return values:
```typescript
export function getUserRole(userId: string): RoleName | null {  // ✅
export function getUserRole(userId) {  // ❌
```

**Use `interface` for object shapes, `type` for unions/aliases:**
```typescript
interface User {  // ✅
  id: string;
  name: string;
}

type RoleName = "admin" | "hr_manager" | "employee";  // ✅
```

**Always use `as const` for constant objects:**
```typescript
export const ROLES = {
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  EMPLOYEE: 'employee',
} as const;  // ✅ Ensures literal types
```

### File Headers

**Add JSDoc comments** to utility files and key modules:
```typescript
/**
 * Rate Limiting Utility
 * Implements token bucket algorithm for rate limiting
 */
```

### Naming Conventions

- **Files:** `kebab-case.ts` (e.g., `auth-store.ts`, `with-role.ts`)
- **Components:** `PascalCase.tsx` (e.g., `AppSidebar.tsx`)
- **Hooks:** `use-prefix` (e.g., `usePermissions`, `useAuth`)
- **Constants:** `SCREAMING_SNAKE_CASE` (e.g., `ROLES`, `PERMISSIONS`)
- **Functions:** `camelCase` (e.g., `generateToken`, `hasPermission`)
- **Types/Interfaces:** `PascalCase` (e.g., `JWTPayload`, `RoleName`)

### Error Handling

**API Routes:** Always return consistent JSON structure:
```typescript
return NextResponse.json(
  { success: false, message: "Error description" },
  { status: 500 }
);
```

**Try-Catch:** Use try-catch in async operations, avoid silent failures:
```typescript
try {
  const result = await operation();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error("Operation failed:", error);
  return NextResponse.json(
    { success: false, message: "Operation failed" },
    { status: 500 }
  );
}
```

**User-facing errors:** Use toast notifications (sonner):
```typescript
import { toast } from "sonner";

toast.error("Failed to save", {
  description: error.message,
});
```

### React Components

**Client Components:** Add `"use client"` directive at top when needed:
```typescript
"use client";

import { useState } from "react";
```

**Component Structure:**
```typescript
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
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

### Security Guidelines

**CRITICAL:** Always use HOCs for API protection:
```typescript
import { withRole } from "@/lib/auth/with-role";
import { ROLES } from "@/lib/constants/roles";

export const POST = withRole(async (request) => {
  // Handler code
}, [ROLES.ADMIN]);  // Specify allowed roles
```

**NEVER hardcode roles:**
```typescript
if (user.role === ROLES.ADMIN) { }  // ✅ Good
if (user.role === "admin") { }      // ❌ Bad
```

**UI Protection:** Use permission hooks and components:
```typescript
import { usePermissions } from "@/hooks/use-permissions";
import { AdminOnly } from "@/components/auth/protected-action";

const { isAdmin } = usePermissions();
{isAdmin && <Button>Admin Action</Button>}
// OR
<AdminOnly><Button>Admin Action</Button></AdminOnly>
```

**Audit Logging:** Log security-sensitive actions:
```typescript
import { logAuditEvent, AuditAction } from "@/lib/audit-log";

logAuditEvent(AuditAction.PAYROLL_MARKED_PAID, user, {
  ipAddress,
  userAgent,
  details: { payrollIds },
});
```

### API Client

**Always use the centralized API client:**
```typescript
import { apiClient } from "@/lib/api-client";

const response = await apiClient.post<ResponseType>("/api/endpoint", data);
```

### State Management

**Use Zustand for global state:**
```typescript
export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      // state and actions
    }),
    { name: "my-store" }
  )
);
```

## Common Patterns

### Protected API Route
```typescript
export const GET = withRole(async (request) => {
  const user = request.user;  // Available via withRole
  return NextResponse.json({ success: true, data: {...} });
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
```

### Form with React Hook Form + Zod
```typescript
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: {...},
});
```

### Rate Limiting
```typescript
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";

const rateLimit = checkRateLimit(clientId, RateLimitPresets.AUTH);
if (!rateLimit.allowed) {
  return NextResponse.json({...}, { status: 429 });
}
```

## Testing Guidelines

- Tests are in `/tests` directory as standalone `.mjs` files
- Start dev server before running tests: `npm run dev`
- Tests make real HTTP requests to `http://localhost:3000`
- Use test users: `admin@hrflow.com/admin123`, `hr@hrflow.com/hr123`, `sarah.johnson@hrflow.com/emp123`

## Important Notes

- **Never skip security checks** - All API routes MUST use `withAuth` or `withRole`
- **Always validate input** - Use Zod schemas for validation
- **Log sensitive actions** - Use audit logging for compliance
- **Handle errors gracefully** - Never expose internal errors to users
- **Respect rate limits** - Apply appropriate rate limiting to endpoints
- **Follow defense in depth** - Protect both backend AND frontend
