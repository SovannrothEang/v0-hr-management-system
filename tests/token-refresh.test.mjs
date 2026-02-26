#!/usr/bin/env node
/**
 * Token Refresh Test Script
 * Tests automatic token refresh functionality:
 * 1. Login and get tokens
 * 2. Remove access token (simulate expiration)
 * 3. Check if refresh token can get new access token
 * 4. Test that no access token + no refresh token = redirect to login
 * 
 * Usage: node tests/token-refresh.test.mjs
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
  log('blue', `   - CSRF token: ${cookies.csrf_token ? 'Present ✓' : 'Missing ✗'}`);

  return {
    cookies,
    csrfToken: data.data?.csrfToken || cookies.csrf_token,
    accessToken: data.data?.accessToken,
    user: data.data?.user,
  };
}

/**
 * Test 1: Access protected route with valid access token
 */
async function testWithValidToken(session) {
  log('blue', '\n2. Testing access with valid access token...');
  
  const response = await fetch(`${BASE_URL}/api/dashboard/stats`, {
    headers: {
      'Authorization': `Bearer ${session.accessToken}`,
      'Cookie': cookiesToHeader(session.cookies),
    },
  });

  if (response.status === 200) {
    log('green', `   ✓ Access granted with valid token (${response.status})`);
    return true;
  } else {
    log('red', `   ✗ Unexpected status: ${response.status}`);
    return false;
  }
}

/**
 * Test 2: Access protected route WITHOUT access token but WITH refresh token
 * Should trigger automatic token refresh
 */
async function testRefreshTokenFlow(session) {
  log('blue', '\n3. Testing token refresh (no access token, has refresh token)...');
  log('yellow', '   Removing access token from request...');
  
  // Create cookies without auth_token (only refresh_token)
  const cookiesWithoutAccess = { ...session.cookies };
  delete cookiesWithoutAccess.auth_token;
  
  log('blue', `   - Cookies being sent: ${Object.keys(cookiesWithoutAccess).join(', ')}`);
  
  // Try to access protected route without access token
  // The server should use refresh_token to get new access token
  const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookiesToHeader(cookiesWithoutAccess),
    },
    credentials: 'include',
  });

  log('blue', `   - Refresh endpoint response: ${response.status}`);
  
  if (response.status === 200) {
    const data = await response.json();
    const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
    const newCookies = parseCookies(setCookieHeaders);
    
    log('green', `   ✓ Token refresh successful!`);
    log('blue', `   - New access token: ${newCookies.auth_token ? 'Received ✓' : 'Not received ✗'}`);
    log('blue', `   - New CSRF token: ${data.data?.csrfToken ? 'Received ✓' : 'Not received ✗'}`);
    
    if (data.data?.accessToken) {
      // Test access with new token
      log('blue', '\n4. Testing access with refreshed token...');
      const testResponse = await fetch(`${BASE_URL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${data.data.accessToken}`,
          'Cookie': cookiesToHeader(newCookies),
        },
      });
      
      if (testResponse.status === 200) {
        log('green', `   ✓ Access granted with refreshed token (${testResponse.status})`);
        return true;
      } else {
        log('red', `   ✗ Access denied with refreshed token: ${testResponse.status}`);
        return false;
      }
    }
    return true;
  } else if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    log('red', `   ✗ Refresh failed: ${errorData.message || 'Unauthorized'}`);
    return false;
  } else {
    log('red', `   ✗ Unexpected status: ${response.status}`);
    return false;
  }
}

/**
 * Test 3: Access without any tokens
 */
async function testWithoutAnyTokens() {
  log('blue', '\n5. Testing access without any tokens...');
  
  const response = await fetch(`${BASE_URL}/api/dashboard/stats`);
  
  if (response.status === 401) {
    log('green', `   ✓ Correctly rejected without tokens (${response.status})`);
    return true;
  } else {
    log('red', `   ✗ Unexpected status: ${response.status} (expected 401)`);
    return false;
  }
}

/**
 * Test 4: Simulate expired access token with valid refresh token
 */
async function testExpiredAccessToken(session) {
  log('blue', '\n6. Testing with expired/invalid access token + valid refresh token...');
  
  // Create cookies with invalid access token but valid refresh token
  const cookiesWithInvalidAccess = { 
    ...session.cookies,
    auth_token: 'invalid.expired.token' 
  };
  
  // Try to call refresh endpoint
  const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookiesToHeader(cookiesWithInvalidAccess),
    },
    credentials: 'include',
  });

  if (response.status === 200) {
    log('green', `   ✓ Refresh works even with invalid access token (${response.status})`);
    return true;
  } else if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    log('yellow', `   ⚠ Refresh failed: ${errorData.message || 'Session expired'}`);
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
  log('cyan', 'Token Refresh Functionality Tests');
  log('cyan', `${'='.repeat(60)}`);
  
  let session;
  let results = {
    login: false,
    validToken: false,
    refreshFlow: false,
    noTokens: false,
    expiredToken: false,
  };

  try {
    // Test 1: Login
    session = await login();
    results.login = true;

    // Test 2: Valid token access
    results.validToken = await testWithValidToken(session);

    // Test 3: Refresh token flow
    results.refreshFlow = await testRefreshTokenFlow(session);

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
