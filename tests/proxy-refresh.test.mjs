#!/usr/bin/env node
/**
 * Proxy Token Refresh Test Script
 * Tests that the proxy layer correctly handles token refresh:
 * 1. Access protected route with valid token
 * 2. Access protected route with expired/missing access token but valid refresh token
 * 3. Access protected route with no tokens (should fail)
 * 
 * Usage: node tests/proxy-refresh.test.mjs
 * Prerequisites: Dev server must be running on localhost:3000
 */

const BASE_URL = 'http://localhost:3000';

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
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
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
 * Login and return session info
 */
async function login() {
  log('blue', '\n1. Logging in...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
  const cookies = parseCookies(setCookieHeaders);

  log('green', `   ✓ Login successful`);
  log('blue', `   - Access token: ${cookies.auth_token ? 'Present ✓' : 'Missing ✗'}`);
  log('blue', `   - Refresh token: ${cookies.refresh_token ? 'Present ✓' : 'Missing ✗'}`);

  return {
    cookies,
    csrfToken: data.data?.csrfToken || cookies.csrf_token,
    accessToken: data.data?.accessToken,
    user: data.data?.user,
  };
}

/**
 * Test 1: Access protected proxy route with valid token
 */
async function testWithValidToken(session) {
  log('blue', '\n2. Testing proxy access with valid token...');
  
  const response = await fetch(`${BASE_URL}/api/dashboard/stats`, {
    headers: {
      'Cookie': cookiesToHeader(session.cookies),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 200 && data.success) {
    log('green', `   ✓ Proxy access granted with valid token (${response.status})`);
    return true;
  } else {
    log('red', `   ✗ Proxy access denied: ${response.status} - ${data.message || 'Unknown error'}`);
    return false;
  }
}

/**
 * Test 2: Access protected proxy route WITHOUT access token but WITH refresh token
 * The proxy layer should automatically refresh and set new cookies
 */
async function testProxyRefresh(session) {
  log('blue', '\n3. Testing proxy auto-refresh (no access token, has refresh token)...');
  log('yellow', '   Removing access token from cookies...');
  
  // Create cookies without auth_token (only refresh_token and csrf_token)
  const cookiesWithoutAccess = { ...session.cookies };
  delete cookiesWithoutAccess.auth_token;
  
  log('blue', `   - Cookies being sent: ${Object.keys(cookiesWithoutAccess).join(', ')}`);
  
  const response = await fetch(`${BASE_URL}/api/dashboard/stats`, {
    headers: {
      'Cookie': cookiesToHeader(cookiesWithoutAccess),
    },
  });

  const data = await response.json().catch(() => ({}));
  const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
  const newCookies = parseCookies(setCookieHeaders);

  log('blue', `   - Response status: ${response.status}`);
  log('blue', `   - New cookies received: ${Object.keys(newCookies).join(', ') || 'None'}`);

  if (response.status === 200 && data.success) {
    if (newCookies.auth_token) {
      log('green', `   ✓ Proxy auto-refreshed session and returned new access token!`);
      return true;
    } else {
      log('yellow', `   ⚠ Access granted but no new cookie set (session refreshed in memory)`);
      return true;
    }
  } else if (response.status === 401) {
    log('red', `   ✗ Proxy did not auto-refresh: ${data.message || 'Unauthorized'}`);
    return false;
  } else {
    log('red', `   ✗ Unexpected status: ${response.status}`);
    return false;
  }
}

/**
 * Test 3: Access proxy route without any tokens
 */
async function testWithoutAnyTokens() {
  log('blue', '\n4. Testing proxy access without any tokens...');
  
  const response = await fetch(`${BASE_URL}/api/dashboard/stats`);
  const data = await response.json().catch(() => ({}));
  
  if (response.status === 401) {
    log('green', `   ✓ Correctly rejected without tokens (${response.status})`);
    log('blue', `   - Message: ${data.message || 'No message'}`);
    return true;
  } else {
    log('red', `   ✗ Unexpected status: ${response.status} (expected 401)`);
    return false;
  }
}

/**
 * Test 4: Access proxy with expired/invalid access token + valid refresh token
 */
async function testExpiredAccessToken(session) {
  log('blue', '\n5. Testing proxy with invalid access token + valid refresh token...');
  
  // Create cookies with invalid access token but valid refresh token
  const cookiesWithInvalidAccess = { 
    ...session.cookies,
    auth_token: 'invalid.expired.token.signature' 
  };
  
  const response = await fetch(`${BASE_URL}/api/dashboard/stats`, {
    headers: {
      'Cookie': cookiesToHeader(cookiesWithInvalidAccess),
    },
  });

  const data = await response.json().catch(() => ({}));
  const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
  const newCookies = parseCookies(setCookieHeaders);

  log('blue', `   - Response status: ${response.status}`);
  
  if (response.status === 200 && data.success) {
    if (newCookies.auth_token) {
      log('green', `   ✓ Proxy auto-refreshed and issued new token!`);
      return true;
    } else {
      log('yellow', `   ⚠ Access granted but no new cookie (token may still be valid)`);
      return true;
    }
  } else if (response.status === 401) {
    log('red', `   ✗ Proxy failed to refresh: ${data.message || 'Session expired'}`);
    return false;
  } else {
    log('red', `   ✗ Unexpected status: ${response.status}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('cyan', `${'='.repeat(60)}`);
  log('cyan', 'Proxy Token Refresh Tests');
  log('cyan', `${'='.repeat(60)}`);
  
  let session;
  let results = {
    login: false,
    validToken: false,
    proxyRefresh: false,
    noTokens: false,
    expiredToken: false,
  };

  try {
    // Test 1: Login
    session = await login();
    results.login = true;

    // Test 2: Valid token access
    results.validToken = await testWithValidToken(session);

    // Test 3: Proxy auto-refresh
    results.proxyRefresh = await testProxyRefresh(session);

    // Test 4: No tokens
    results.noTokens = await testWithoutAnyTokens();

    // Test 5: Expired access token
    results.expiredToken = await testExpiredAccessToken(session);

  } catch (error) {
    log('red', `\nTest error: ${error.message}`);
    console.error(error);
  }

  // Summary
  log('cyan', `\n${'='.repeat(60)}`);
  log('cyan', 'Test Summary');
  log('cyan', `${'='.repeat(60)}`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  for (const [test, passed] of Object.entries(results)) {
    const icon = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(color, `  ${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  }
  
  log('cyan', `${'='.repeat(60)}`);
  log(passedTests === totalTests ? 'green' : 'yellow', 
    `Results: ${passedTests}/${totalTests} tests passed`);
  log('cyan', `${'='.repeat(60)}\n`);

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runTests();
