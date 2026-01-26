# Agent Guidelines for HR Management System

Guidelines for AI agents working on this Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui project.

## Build, Lint, and Test Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build (includes TypeScript checking)
npm run start            # Start production server
npm run lint             # Run ESLint (requires eslint.config.js)

# Testing - standalone .mjs files requiring dev server running
node tests/auth.test.mjs            # Auth & RBAC tests (cookie-based auth, CSRF)
node tests/ui-permissions.test.mjs  # UI permission tests

# Run specific test
node tests/<filename>.mjs

# Type checking only
npx tsc --noEmit
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

### TypeScript
- **Explicit types** on function parameters and return values
- **`interface`** for object shapes, **`type`** for unions/aliases
- **`as const`** for constant objects to ensure literal types
- Strict mode enabled (`tsconfig.json`)

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `auth-store.ts`, `with-role.ts` |
| Components | PascalCase | `AppSidebar.tsx` |
| Hooks | usePrefix | `usePermissions`, `useAuth` |
| Constants | SCREAMING_SNAKE | `ROLES`, `PERMISSIONS` |
| Functions | camelCase | `generateToken`, `hasPermission` |
| Types/Interfaces | PascalCase | `JWTPayload`, `SessionUser` |

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

### CSRF Protection
- Mutations (POST/PUT/DELETE) require `X-CSRF-Token` header
- Use `apiClient` which handles CSRF automatically
- CSRF token stored in `csrf_token` cookie (readable by JS)

### Role Checks - NEVER hardcode
```typescript
if (user.role === ROLES.ADMIN) { }     // Good
if (user.role === "admin") { }          // Bad
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

## Common Patterns

### API Client (handles cookies + CSRF)
```typescript
import { apiClient } from "@/lib/api-client";
const { data } = await apiClient.post<ResponseType>("/api/endpoint", body);
```

### Zustand Store
```typescript
export const useMyStore = create<MyState>()(
  persist((set) => ({ /* state and actions */ }), { name: "store-name" })
);
```

### Form with Zod Validation
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  return NextResponse.json({ success: false, message: "Rate limited" }, { status: 429 });
}
```

## Authentication Architecture

- **Cookie-based JWT** with httpOnly cookies (`auth_token`, `refresh_token`)
- **CSRF protection** via `csrf_token` cookie + `X-CSRF-Token` header
- **Refresh token rotation** with reuse detection (see `lib/auth/token-store.ts`)
- **Session validation** via `GET /api/auth/session`

## Key Rules

1. **All API routes MUST use `withAuth` or `withRole`** - no exceptions
2. **Always validate input** with Zod schemas
3. **Log sensitive actions** via audit logging
4. **Never expose internal errors** to users
5. **Use `@/` imports** - never relative paths like `../../`
6. **Defense in depth** - protect both backend AND frontend
7. **Rate limit** auth and sensitive endpoints
