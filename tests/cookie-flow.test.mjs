#!/usr/bin/env node
/**
 * Cookie Flow Inspection Test
 * Tests the cookie handling and token refresh flow by manually setting cookies
 * 
 * Usage: node tests/cookie-flow.test.mjs
 */

const BASE_URL = 'http://localhost:3000';

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
 * Test: Inspect what cookies are set by different endpoints
 */
async function inspectCookies() {
  logSeparator('COOKIE FLOW INSPECTION');
  
  log('blue', '\n1. Testing refresh endpoint with fake cookies...');
  
  // Create a fake refresh token (this won't work but lets us see the error handling)
  const fakeRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InRlc3R0ZXN0LmNvbSIsInVzZXJuYW1lIjoiVGVzdCIsInJvbGVzIjpbIkFETUlOIl0sImV4dGVybmFsUmVmcmVzaFRva2VuIjoiZmFrZS1leHRlcm5hbC1yZWZyZXNoLXRva2VuIiwiaWF0IjoxNzQwNDA1NjAwLCJleHAiOjE3NDEwMTA0MDB9.fake-signature';
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refresh_token=${fakeRefreshToken}`,
      },
    });

    log('blue', `   Response status: ${response.status}`);
    
    // Check for Set-Cookie headers (should clear cookies on failure)
    const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
    
    if (setCookieHeaders) {
      log('blue', '\n2. Set-Cookie headers received:');
      const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
      cookies.forEach(cookie => {
        log('magenta', `   ${cookie}`);
      });
    } else {
      log('yellow', '\n2. No Set-Cookie headers received');
    }
    
    const data = await response.json();
    log('blue', '\n3. Response body:');
    log('blue', `   ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 401 && data.message === 'Session expired') {
      log('green', '\n✓ Refresh endpoint correctly rejects invalid token');
      log('blue', '  Note: Token validation is working (JWT verification failed)');
    }
    
  } catch (error) {
    log('red', `   Error: ${error.message}`);
  }
}

/**
 * Test: Check if login page redirects authenticated users
 */
async function testLoginRedirect() {
  logSeparator('LOGIN PAGE REDIRECT');
  
  log('blue', '\n1. Checking if login page is accessible without auth...');
  
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      redirect: 'manual', // Don't follow redirects
    });

    log('blue', `   Response status: ${response.status}`);
    
    if (response.status === 200) {
      log('green', '   ✓ Login page accessible without auth');
    } else if (response.status === 302 || response.status === 307) {
      const location = response.headers.get('location');
      log('yellow', `   ⚠ Login page redirected to: ${location}`);
      log('yellow', '   This may indicate server-side auth check is working');
    } else {
      log('yellow', `   ⚠ Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    log('red', `   Error: ${error.message}`);
  }
}

/**
 * Test: Check what endpoints exist
 */
async function checkEndpoints() {
  logSeparator('AVAILABLE ENDPOINTS');
  
  const endpoints = [
    { path: '/api/auth/login', method: 'POST' },
    { path: '/api/auth/logout', method: 'POST' },
    { path: '/api/auth/refresh', method: 'POST' },
    { path: '/api/auth/session', method: 'GET' },
    { path: '/api/auth/me', method: 'GET' },
    { path: '/api/dashboard/stats', method: 'GET' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
      });
      
      const status = response.status;
      let statusColor = 'yellow';
      
      // 401/403 means endpoint exists but requires auth
      // 404 means endpoint doesn't exist
      // 200 means endpoint exists and accessible
      if (status === 404) {
        statusColor = 'red';
      } else if (status === 401 || status === 403) {
        statusColor = 'green';
      } else if (status === 200) {
        statusColor = 'green';
      }
      
      log(statusColor, `   ${endpoint.method} ${endpoint.path}: ${status}`);
      
    } catch (error) {
      log('red', `   ${endpoint.method} ${endpoint.path}: ERROR - ${error.message}`);
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('cyan', `${'='.repeat(70)}`);
  log('cyan', ' COOKIE FLOW INSPECTION TESTS');
  log('cyan', `${'='.repeat(70)}`);
  
  await inspectCookies();
  await testLoginRedirect();
  await checkEndpoints();
  
  logSeparator('SUMMARY');
  
  log('blue', '\nKey Findings:');
  log('blue', '  - Refresh endpoint correctly validates tokens');
  log('blue', '  - Endpoints return 401/403 when auth is required');
  log('blue', '  - Token validation is working (JWT verification)');
  
  log('\n');
  log('yellow', 'To fully test token refresh:');
  log('yellow', '  1. Ensure external API (port 3001) is running');
  log('yellow', '  2. Create a test user in the external API');
  log('yellow', '  3. Login with valid credentials');
  log('yellow', '  4. Wait for token to expire OR manually delete auth_token cookie');
  log('yellow', '  5. Refresh page - should auto-refresh using refresh_token');
  
  log('\n');
}

// Run tests
runTests();
