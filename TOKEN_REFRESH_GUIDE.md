# Token Refresh Implementation Summary

## What Was Fixed

### 1. Frontend (`stores/session.ts`)
- **Added `refreshSession()` method**: Calls `/api/auth/refresh` when access token is missing
- **Updated `checkSession()`**: Now attempts to refresh session if no access token exists
- **Handles 401 responses**: Automatically tries to refresh before giving up

### 2. Proxy Layer (`lib/auth/with-auth.ts`)
- **Updated `withAuth()`**: Checks for refresh token when access token is invalid
- **Updated `withAuthProxy()`**: Same refresh logic for proxy routes
- **Cookie management**: Copies refreshed cookies to response

### 3. External Proxy (`lib/proxy.ts`)
- **Added `refreshExternalToken()`**: Refreshes external API tokens when they expire
- **All proxy functions updated**: `proxyGet`, `proxyMutation`, `proxyDelete`, `proxyExport`
- **Automatic retry**: Retries request with refreshed external token on 401

### 4. Refresh Endpoint (`app/api/auth/refresh/route.ts`)
- **Fixed external token refresh**: Now sends `externalRefreshToken` in Cookie header
- **Updates external tokens**: Stores new external access/refresh tokens from external API
- **Better logging**: Added console logs for debugging

### 5. Login Protection (`app/(auth)/login/page.tsx` & `app/(auth)/layout.tsx`)
- **Client-side redirect**: Redirects authenticated users to dashboard
- **Server-side protection**: Layout checks auth server-side and redirects

## How It Should Work

### Scenario 1: Access Token Expired, Refresh Token Valid
1. User makes request with expired `auth_token` cookie
2. `withAuthProxy` detects invalid session
3. Finds `refresh_token` cookie and calls `refreshAuthSession()`
4. New session created with rotated tokens
5. Request proceeds with new `auth_token`
6. Response includes new cookies

### Scenario 2: External API Token Expired
1. Proxy makes request to external API with `externalAccessToken`
2. External API returns 401
3. `refreshExternalToken()` called with `externalRefreshToken`
4. External API returns new tokens
5. Request retried with new `externalAccessToken`
6. New external tokens stored in session

### Scenario 3: No Valid Tokens
1. User accesses protected route without valid tokens
2. `withAuthProxy` checks for `refresh_token`
3. No refresh token found or refresh fails
4. Returns 401 and clears all auth cookies
5. User redirected to login page

### Scenario 4: Authenticated User Tries to Access Login
1. Server-side layout checks for valid session
2. If authenticated, redirects to dashboard
3. Client-side effect also checks and redirects
4. User never sees login page

## Testing

### Unit Tests Created
- `tests/token-refresh-logic.test.mjs` - Tests auth endpoint behavior
- `tests/cookie-flow.test.mjs` - Tests cookie handling
- `tests/proxy-refresh.test.mjs` - Tests proxy auto-refresh
- `tests/token-debug.test.mjs` - Comprehensive token testing

### Manual Testing Required
To fully verify the refresh flow:

1. **Setup External API**
   ```bash
   # Ensure external API is running on port 3001
   # Create a test user in the external API
   ```

2. **Test Login & Token Storage**
   ```bash
   # Login via frontend
   # Check cookies in browser DevTools:
   # - auth_token (httpOnly)
   # - refresh_token (httpOnly, path=/api/auth)
   # - csrf_token
   ```

3. **Test Token Refresh**
   ```bash
   # Option A: Wait for token to expire (24 hours)
   # Option B: Manually delete auth_token cookie in DevTools
   # Refresh page - should auto-refresh and get new auth_token
   ```

4. **Test External Token Refresh**
   ```bash
   # Make API calls that proxy to external API
   # Wait for external token to expire
   # Should automatically refresh external token
   ```

5. **Test Login Protection**
   ```bash
   # Login successfully
   # Navigate to /login
   # Should redirect to /dashboard
   ```

## Common Issues & Solutions

### Issue: "Refresh token not working"
**Check:**
1. Is `refresh_token` cookie being set? (check DevTools > Application > Cookies)
2. Is `refresh_token` cookie httpOnly? (should be true)
3. Is `refresh_token` path `/api/auth`? (correct)
4. Does external API return `refreshToken` in login response?

### Issue: "External token not refreshing"
**Check:**
1. Is `externalRefreshToken` stored in JWT payload?
2. Is external API `/auth/refresh` endpoint working?
3. Check server logs for "[Refresh] External token refreshed" messages

### Issue: "Can still access login when authenticated"
**Check:**
1. Server-side layout should redirect (check network tab for 307 redirect)
2. Client-side effect should also redirect
3. Check if `isAuthenticated` is true in session store

## Debug Logging

Enable these console logs to debug:
```javascript
// In browser console
localStorage.debug = '*'

// Check session store
JSON.parse(localStorage.getItem('hrflow-session'))

// Check cookies
document.cookie
```

Server logs to watch:
```
[withAuth] No valid session, checking for refresh token...
[withAuth] Refresh token found, attempting refresh...
[withAuth] Session refreshed successfully
[Refresh] External token refreshed: {...}
[Proxy GET] Received 401, attempting external token refresh...
```

## Files Modified

1. `stores/session.ts` - Added refreshSession method
2. `lib/auth/with-auth.ts` - Added auto-refresh logic
3. `lib/proxy.ts` - Added external token refresh
4. `app/api/auth/refresh/route.ts` - Fixed external refresh
5. `app/(auth)/login/page.tsx` - Added auth check
6. `app/(auth)/layout.tsx` - Server-side auth check

## Next Steps

1. Run tests with valid credentials to verify full flow
2. Monitor server logs during testing
3. Check browser cookies in DevTools
4. Test edge cases (expired refresh token, network errors, etc.)
