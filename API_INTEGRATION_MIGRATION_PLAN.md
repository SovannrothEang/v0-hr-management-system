# API Integration Migration Plan

## Overview

This document outlines the plan to migrate the HRMS frontend to use an external API by defining the API URL in environment variables instead of using hardcoded values in the codebase.

## Current State

**Current API Configuration:**
- File: `lib/api-client.ts:9`
- Current value: `const API_BASE_URL = "/api";`
- This is a relative URL that points to Next.js API routes

**Target State:**
- External API URL defined in `.env.development`
- Support for multiple environments (development, staging, production)
- Configurable base URL for API requests

---

## Migration Steps

### Phase 1: Environment Configuration

#### 1.1 Create Environment Files

Create the following environment files in the project root:

**`.env.development`** (Local development)
```env
# External API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_API_SWAGGER_URL=http://localhost:3001/api/swagger
```

**`.env.staging`** (Staging environment)
```env
# External API Configuration
NEXT_PUBLIC_API_BASE_URL=https://staging-api.hrflow.com/api
NEXT_PUBLIC_API_SWAGGER_URL=https://staging-api.hrflow.com/api/swagger
```

**`.env.production`** (Production environment)
```env
# External API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.hrflow.com/api
NEXT_PUBLIC_API_SWAGGER_URL=https://api.hrflow.com/api/swagger
```

**`.env.example`** (Template for developers)
```env
# External API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_API_SWAGGER_URL=http://localhost:3001/api/swagger
```

#### 1.2 Update `.gitignore`

Ensure the following patterns are in `.gitignore`:
```
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.staging.local
```

---

### Phase 2: Update API Client

#### 2.1 Modify `lib/api-client.ts`

**Before:**
```typescript
const API_BASE_URL = "/api";
```

**After:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
```

**Full updated file:**
```typescript
/**
 * API Client
 * Handles all API requests with cookie-based authentication and CSRF protection
 * Cookies are automatically sent by the browser - no manual token handling needed
 */

import { getCsrfToken } from "@/stores/session";

// Get API base URL from environment variable
// Falls back to "/api" for backward compatibility with Next.js API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// ... rest of the file remains unchanged
```

---

### Phase 3: Update Documentation

#### 3.1 Update `FRONTEND_INTEGRATION.md`

Add a new section at the top of the file:

## API Configuration

### Environment Variables

The API base URL is configured via environment variables. Create a `.env.development` file in your project root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

**Available Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - The base URL for all API requests
- `NEXT_PUBLIC_API_SWAGGER_URL` - URL for API documentation (optional)

### Environment-Specific Configuration

| Environment | File | Default API URL |
|-------------|------|-----------------|
| Development | `.env.development` | `http://localhost:3001/api` |
| Staging | `.env.staging` | `https://staging-api.hrflow.com/api` |
| Production | `.env.production` | `https://api.hrflow.com/api` |

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

#### 3.2 Create `ENVIRONMENT_SETUP.md`

Create a new documentation file for environment setup:

# Environment Setup Guide

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env.development
   ```

2. Update the API URL if needed:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for API requests | `http://localhost:3001/api` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_SWAGGER_URL` | API documentation URL | `http://localhost:3001/api/swagger` |

## Environment-Specific Setup

### Development

Create `.env.development`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

### Staging

Create `.env.staging`:
```env
NEXT_PUBLIC_API_BASE_URL=https://staging-api.hrflow.com/api
```

### Production

Create `.env.production`:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.hrflow.com/api
```

## Troubleshooting

### API URL Not Working

1. Verify the environment file exists in the project root
2. Check that the variable name is correct (case-sensitive)
3. Restart the development server after changing environment variables
4. Check browser console for CORS errors

### CORS Issues

If you encounter CORS errors:
- Ensure the external API server is configured to accept requests from your frontend domain
- Check that the API URL is correct (no trailing slashes)
- Verify the API server is running and accessible

### Environment Variables Not Loading

1. Ensure you're using the `NEXT_PUBLIC_` prefix for browser-accessible variables
2. Restart the Next.js development server
3. Check that the environment file is in the project root directory
4. Verify the file name is correct (`.env.development`, not `.env.development.local`)

## Security Notes

- Never commit `.env` files to version control
- Use `.env.example` to document required variables
- Keep production API keys secure (use server-side environment variables for sensitive data)
- The `NEXT_PUBLIC_` prefix makes variables accessible in the browser - only use for non-sensitive data

---

### Phase 4: Testing Plan

#### 4.1 Local Development Testing

1. **Create `.env.development`** with the correct API URL
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Test API endpoints:**
   - Login functionality
   - Employee CRUD operations
   - Attendance tracking
   - Payroll operations
   - Report generation
4. **Verify environment variable is loaded:**
   - Check browser Network tab for correct API URLs
   - Verify requests go to the external API, not Next.js API routes

#### 4.2 Build Testing

1. **Build the application:**
   ```bash
   npm run build
   ```
2. **Start production server:**
   ```bash
   npm run start
   ```
3. **Test with production environment variables**

#### 4.3 Integration Testing

1. **Test all API modules:**
   - Authentication (login, logout, session refresh)
   - Employee management
   - Attendance tracking
   - Payroll processing
   - Audit logs
   - Reports

2. **Verify error handling:**
   - Network failures
   - API errors (400, 401, 403, 404, 500)
   - Rate limiting (429)

---

### Phase 5: Rollback Plan

If issues arise during migration:

1. **Immediate rollback:**
   - Revert `lib/api-client.ts` to use hardcoded `/api`
   - Remove environment variable references

2. **Gradual rollback:**
   - Keep environment variable support but default to `/api`
   - This allows for backward compatibility

---

## Implementation Checklist

### Pre-Migration
- [ ] Review current API usage across the codebase
- [ ] Identify all API endpoints being used
- [ ] Document current API base URL usage
- [ ] Create backup of current `api-client.ts`

### Environment Setup
- [ ] Create `.env.example` file
- [ ] Create `.env.development` file
- [ ] Create `.env.staging` file
- [ ] Create `.env.production` file
- [ ] Update `.gitignore` if needed

### Code Changes
- [ ] Update `lib/api-client.ts` to use environment variable
- [ ] Add fallback to `/api` for backward compatibility
- [ ] Test environment variable loading

### Documentation
- [ ] Update `FRONTEND_INTEGRATION.md` with configuration section
- [ ] Create `ENVIRONMENT_SETUP.md` guide
- [ ] Update README if needed

### Testing
- [ ] Test local development with `.env.development`
- [ ] Test API endpoints (login, employees, attendance, payroll, reports)
- [ ] Test error handling
- [ ] Test build process
- [ ] Test production server

### Post-Migration
- [ ] Verify all API calls work correctly
- [ ] Check for any console errors
- [ ] Verify environment variables are properly loaded
- [ ] Update team documentation
- [ ] Communicate changes to team

---

## Timeline

**Estimated Duration:** 2-3 hours

| Phase | Task | Time |
|-------|------|------|
| Phase 1 | Environment Configuration | 30 min |
| Phase 2 | API Client Update | 15 min |
| Phase 3 | Documentation | 30 min |
| Phase 4 | Testing | 60 min |
| Phase 5 | Rollback Planning | 15 min |

---

## Dependencies

### Required
- Next.js 16+ (already installed)
- TypeScript (already installed)

### No New Dependencies Required

This migration only requires environment variable configuration and does not introduce new dependencies.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Environment variables not loading | High | Use fallback to `/api`, test thoroughly |
| CORS issues with external API | High | Verify API server configuration, test early |
| Breaking existing functionality | Medium | Maintain backward compatibility with fallback |
| Team confusion about new setup | Low | Clear documentation and communication |

---

## Success Criteria

1. ✅ API requests are routed to the external API URL
2. ✅ All existing functionality works correctly
3. ✅ Environment variables are properly loaded in all environments
4. ✅ Documentation is updated and clear
5. ✅ Team can easily set up local development
6. ✅ No breaking changes to existing code

---

## Notes

- The `NEXT_PUBLIC_` prefix is required for Next.js to expose environment variables to the browser
- Environment variables are embedded at build time, so changing them requires a rebuild
- For server-side API calls, use `process.env.API_BASE_URL` (without `NEXT_PUBLIC_`)
- This migration assumes the external API is already running and accessible

---

## Related Files

- `lib/api-client.ts` - Main API client file (to be modified)
- `FRONTEND_INTEGRATION.md` - API documentation (to be updated)
- `.env.development` - Development environment variables (to be created)
- `.env.example` - Environment template (to be created)
- `ENVIRONMENT_SETUP.md` - Setup guide (to be created)

---

*Last updated: January 27, 2026*
