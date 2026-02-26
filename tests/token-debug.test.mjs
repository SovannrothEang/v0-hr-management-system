#!/usr/bin/env node
/**
 * Token Storage & Refresh Debug Test
 * Comprehensive test to verify token storage and refresh functionality
 * 
 * Usage: node tests/token-debug.test.mjs
 * Prerequisites: Dev server must be running on localhost:3000
 */

const BASE_URL = 'http://localhost:3000';
const EXTERNAL_API_URL = 'http://localhost:3001/api';

// Test user
const TEST_USER = {
  email: 'admin@hrflow.com',
  password: 'admin123',
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSeparator(title) {
  log('cyan', `\n${'='.repeat(70)}`);
  log('cyan', ` ${title}`);
  log('cyan', `${'='.repeat(70)}`);
}

/**
 * Parse Set-Cookie headers into a cookie jar object
 */
function parseCookies(setCookieHeaders) {
  const cookies = {};
  if (!setCookieHeaders) return cookies;

  const headerArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

  for (const header of headerArray) {
    const parts = header.split(';')[0];
    const [name, ...valueParts] = parts.split('=');
    cookies[name.trim()] = valueParts.join('=');
  }

  return cookies;
}

/**
 * Convert cookie jar to Cookie header string
 */
function cookiesToHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

/**
 * Test 1: Check what cookies are set after login
 */
async function testLoginAndCookieStorage() {
  logSeparator('TEST 1: Login & Cookie Storage');
  
  log('blue', '\n1. Attempting login...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }),
    });

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      log('red', `   ✗ Login failed: ${data.message || 'Unknown error'}`);
      return { success: false, cookies: null, data: null };
    }

    log('green', `   ✓ Login successful`);
    
    // Parse cookies
    const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
    const cookies = parseCookies(setCookieHeaders);
    
    log('blue', '\n2. Checking stored cookies:');
    log('blue', `   - auth_token: ${cookies.auth_token ? '✓ Present' : '✗ Missing'}`);
    log('blue', `   - refresh_token: ${cookies.refresh_token ? '✓ Present' : '✗ Missing'}`);
    log('blue', `   - csrf_token: ${cookies.csrf_token ? '✓ Present' : '✗ Missing'}`);
    
    if (cookies.auth_token) {
      log('magenta', `   - auth_token value: ${cookies.auth_token.substring(0, 50)}...`);
    }
    if (cookies.refresh_token) {
      log('magenta', `   - refresh_token value: ${cookies.refresh_token.substring(0, 50)}...`);
    }
    
    log('blue', '\n3. Checking response data:');
    if (data.data) {
      log('blue', `   - accessToken in response: ${data.data.accessToken ? '✓ Present' : '✗ Missing'}`);
      log('blue', `   - refreshToken in response: ${data.data.refreshToken ? '✓ Present' : '✗ Missing'}`);
      log('blue', `   - csrfToken in response: ${data.data.csrfToken ? '✓ Present' : '✗ Missing'}`);
      log('blue', `   - user in response: ${data.data.user ? '✓ Present' : '✗ Missing'}`);
    } else {
      log('red', `   ✗ No data in response`);
    }
    
    return { success: true, cookies, data: data.data };
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return { success: false, cookies: null, data: null };
  }
}

/**
 * Test 2: Direct refresh token test with external API
 */
async function testDirectExternalRefresh(refreshToken) {
  logSeparator('TEST 2: Direct External API Refresh');
  
  if (!refreshToken) {
    log('yellow', '   ⚠ No refresh token provided, skipping test');
    return { success: false };
  }
  
  log('blue', '\n1. Calling external API /auth/refresh directly...');
  
  try {
    const response = await fetch(`${EXTERNAL_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refresh_token=${refreshToken}`,
      },
    });

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.ok && data.data?.accessToken) {
      log('green', `   ✓ External refresh successful!`);
      log('blue', `   - New access token received: ✓`);
      return { success: true, data: data.data };
    } else {
      log('red', `   ✗ External refresh failed: ${data.message || 'No access token in response'}`);
      log('yellow', `   Response data: ${JSON.stringify(data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return { success: false };
  }
}

/**
 * Test 3: Test proxy refresh endpoint
 */
async function testProxyRefresh(cookies) {
  logSeparator('TEST 3: Proxy /auth/refresh Endpoint');
  
  if (!cookies?.refresh_token) {
    log('yellow', '   ⚠ No refresh token in cookies, skipping test');
    return { success: false };
  }
  
  log('blue', '\n1. Calling proxy /api/auth/refresh with refresh_token cookie...');
  
  try {
    // Only send refresh_token cookie
    const refreshOnlyCookies = { refresh_token: cookies.refresh_token };
    
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookiesToHeader(refreshOnlyCookies),
      },
    });

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
    const newCookies = parseCookies(setCookieHeaders);
    
    if (response.ok && data.success) {
      log('green', `   ✓ Proxy refresh successful!`);
      log('blue', `   - New auth_token cookie: ${newCookies.auth_token ? '✓ Present' : '✗ Missing'}`);
      log('blue', `   - New csrf_token cookie: ${newCookies.csrf_token ? '✓ Present' : '✗ Missing'}`);
      
      if (newCookies.auth_token) {
        log('magenta', `   - New auth_token: ${newCookies.auth_token.substring(0, 50)}...`);
      }
      
      return { success: true, cookies: newCookies, data: data.data };
    } else {
      log('red', `   ✗ Proxy refresh failed: ${data.message || 'Unknown error'}`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return { success: false };
  }
}

/**
 * Test 4: Test protected route with expired/missing access token
 */
async function testProtectedRouteWithExpiredToken(cookies) {
  logSeparator('TEST 4: Protected Route with Expired Token');
  
  if (!cookies?.refresh_token) {
    log('yellow', '   ⚠ No refresh token available, skipping test');
    return { success: false };
  }
  
  log('blue', '\n1. Testing /api/dashboard/stats WITHOUT auth_token (only refresh_token)...');
  
  try {
    // Only send refresh_token, NOT auth_token
    const cookiesWithoutAuth = { refresh_token: cookies.refresh_token };
    
    const response = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: {
        'Cookie': cookiesToHeader(cookiesWithoutAuth),
      },
    });

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
    const newCookies = parseCookies(setCookieHeaders);
    
    if (response.ok && data.success) {
      log('green', `   ✓ Protected route accessed successfully!`);
      log('blue', `   - Auto-refreshed session: ${newCookies.auth_token ? '✓ Yes' : '? Unknown'}`);
      
      if (newCookies.auth_token) {
        log('magenta', `   - New auth_token set: ${newCookies.auth_token.substring(0, 50)}...`);
      }
      
      return { success: true };
    } else if (response.status === 401) {
      log('red', `   ✗ Request failed with 401 (no auto-refresh)`);
      log('yellow', `   Message: ${data.message || 'No message'}`);
      return { success: false };
    } else {
      log('yellow', `   ⚠ Unexpected status: ${response.status}`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return { success: false };
  }
}

/**
 * Test 5: Test external proxy with token refresh
 */
async function testExternalProxyRefresh(originalCookies, newCookies) {
  logSeparator('TEST 5: External Proxy Token Refresh');
  
  const accessToken = newCookies?.auth_token || originalCookies?.auth_token;
  const refreshToken = originalCookies?.refresh_token;
  
  if (!accessToken || !refreshToken) {
    log('yellow', '   ⚠ Missing tokens, skipping test');
    return { success: false };
  }
  
  log('blue', '\n1. Testing proxy request with potentially expired external token...');
  log('blue', `   Using access token: ${accessToken.substring(0, 50)}...`);
  
  try {
    // Make a request that requires external API authentication
    const response = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      headers: {
        'Cookie': `auth_token=${accessToken}`,
      },
    });

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log('green', `   ✓ Proxy request successful!`);
      log('blue', `   - External token was valid or auto-refreshed`);
      return { success: true };
    } else if (response.status === 401) {
      log('red', `   ✗ External token expired and refresh failed`);
      log('yellow', `   Message: ${data.message || 'No message'}`);
      return { success: false };
    } else {
      log('yellow', `   ⚠ Unexpected status: ${response.status}`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return { success: false };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('cyan', `${'='.repeat(70)}`);
  log('cyan', ' TOKEN STORAGE & REFRESH DEBUG TESTS');
  log('cyan', `${'='.repeat(70)}`);
  
  const results = {
    login: false,
    externalRefresh: false,
    proxyRefresh: false,
    protectedRoute: false,
    externalProxy: false,
  };
  
  let cookies = null;
  let refreshedCookies = null;
  let loginData = null;

  try {
    // Test 1: Login and check cookie storage
    const loginResult = await testLoginAndCookieStorage();
    results.login = loginResult.success;
    cookies = loginResult.cookies;
    loginData = loginResult.data;

    if (!results.login) {
      log('red', '\n✗ Login failed, cannot continue tests');
      process.exit(1);
    }

    // Test 2: Direct external API refresh
    const externalRefreshResult = await testDirectExternalRefresh(
      cookies.refresh_token || loginData?.refreshToken || loginData?.tokens?.refreshToken
    );
    results.externalRefresh = externalRefreshResult.success;

    // Test 3: Proxy refresh endpoint
    const proxyRefreshResult = await testProxyRefresh(cookies);
    results.proxyRefresh = proxyRefreshResult.success;
    refreshedCookies = proxyRefreshResult.cookies;

    // Test 4: Protected route with expired token
    const protectedRouteResult = await testProtectedRouteWithExpiredToken(cookies);
    results.protectedRoute = protectedRouteResult.success;

    // Test 5: External proxy refresh
    const externalProxyResult = await testExternalProxyRefresh(cookies, refreshedCookies);
    results.externalProxy = externalProxyResult.success;

  } catch (error) {
    log('red', `\n✗ Test error: ${error.message}`);
    console.error(error);
  }

  // Summary
  logSeparator('TEST SUMMARY');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  for (const [test, passed] of Object.entries(results)) {
    const icon = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(color, `  ${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  }
  
  log('cyan', `${'='.repeat(70)}`);
  log(passedTests === totalTests ? 'green' : 'yellow', 
    `\nResults: ${passedTests}/${totalTests} tests passed`);
  log('cyan', `${'='.repeat(70)}\n`);

  // Diagnosis
  if (passedTests < totalTests) {
    log('yellow', '\n🔍 DIAGNOSIS:');
    
    if (!results.login) {
      log('red', '   - Login is failing. Check if test user exists in external API.');
    }
    
    if (results.login && !results.externalRefresh) {
      log('red', '   - External API refresh is not working. Check:');
      log('yellow', '     * Is external API (port 3001) running?');
      log('yellow', '     * Is refresh token valid in external API?');
      log('yellow', '     * Does external API have /auth/refresh endpoint?');
    }
    
    if (results.login && !results.proxyRefresh) {
      log('red', '   - Proxy refresh endpoint is not working. Check:');
      log('yellow', '     * Is Next.js server (port 3000) running?');
      log('yellow', '     * Does proxy correctly forward refresh token to external API?');
      log('yellow', '     * Are cookies being set correctly in the response?');
    }
    
    if (results.proxyRefresh && !results.protectedRoute) {
      log('red', '   - Protected route auto-refresh is not working. Check:');
      log('yellow', '     * Is withAuthProxy calling refreshAuthSession?');
      log('yellow', '     * Are refreshed cookies being copied to the response?');
    }
    
    if (results.login && results.proxyRefresh && !results.externalProxy) {
      log('red', '   - External proxy token refresh is not working. Check:');
      log('yellow', '     * Does proxy.ts have refreshExternalToken function?');
      log('yellow', '     * Is externalRefreshToken being stored in session?');
    }
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runTests();
