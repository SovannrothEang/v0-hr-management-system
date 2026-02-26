#!/usr/bin/env node
/**
 * Token Refresh Logic Test
 * Tests the token refresh logic without requiring valid login credentials
 * 
 * Usage: node tests/token-refresh-logic.test.mjs
 * Prerequisites: Dev server must be running on localhost:3000
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
 * Test 1: Check if refresh endpoint handles missing refresh token
 */
async function testRefreshWithoutToken() {
  logSeparator('TEST 1: Refresh Without Token');
  
  log('blue', '\n1. Calling /api/auth/refresh without any cookies...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.status === 401) {
      log('green', `   ✓ Correctly rejected without refresh token (401)`);
      log('blue', `   - Message: ${data.message || 'No message'}`);
      return true;
    } else {
      log('red', `   ✗ Unexpected status: ${response.status} (expected 401)`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Check if refresh endpoint handles invalid refresh token
 */
async function testRefreshWithInvalidToken() {
  logSeparator('TEST 2: Refresh With Invalid Token');
  
  log('blue', '\n1. Calling /api/auth/refresh with invalid refresh_token...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': 'refresh_token=invalid.token.here',
      },
    });

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.status === 401) {
      log('green', `   ✓ Correctly rejected invalid refresh token (401)`);
      log('blue', `   - Message: ${data.message || 'No message'}`);
      return true;
    } else {
      log('yellow', `   ⚠ Unexpected status: ${response.status}`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Check if protected route rejects without auth
 */
async function testProtectedRouteWithoutAuth() {
  logSeparator('TEST 3: Protected Route Without Auth');
  
  log('blue', '\n1. Calling /api/dashboard/stats without any auth...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/dashboard/stats`);

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.status === 401) {
      log('green', `   ✓ Correctly rejected without authentication (401)`);
      log('blue', `   - Message: ${data.message || 'No message'}`);
      return true;
    } else {
      log('red', `   ✗ Unexpected status: ${response.status} (expected 401)`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Check if login endpoint exists and returns proper error
 */
async function testLoginEndpoint() {
  logSeparator('TEST 4: Login Endpoint');
  
  log('blue', '\n1. Testing login with invalid credentials...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
    });

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    
    // Check if Set-Cookie headers are present
    const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
    
    if (response.status === 401) {
      log('green', `   ✓ Login endpoint working (returned 401 for invalid credentials)`);
      
      if (setCookieHeaders) {
        log('yellow', `   ⚠ Warning: Login set cookies even for failed attempt`);
      } else {
        log('blue', `   - No cookies set for failed login (correct)`);
      }
      
      return true;
    } else {
      log('yellow', `   ⚠ Unexpected status: ${response.status}`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Check session endpoint
 */
async function testSessionEndpoint() {
  logSeparator('TEST 5: Session Endpoint');
  
  log('blue', '\n1. Calling /api/auth/session without auth...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/session`);

    log('blue', `   Response status: ${response.status}`);
    
    const data = await response.json();
    
    if (response.status === 200) {
      if (data.data?.authenticated === false) {
        log('green', `   ✓ Session endpoint working (returns unauthenticated)`);
        return true;
      } else {
        log('yellow', `   ⚠ Unexpected response: ${JSON.stringify(data, null, 2)}`);
        return false;
      }
    } else {
      log('yellow', `   ⚠ Unexpected status: ${response.status}`);
      log('yellow', `   Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('cyan', `${'='.repeat(70)}`);
  log('cyan', ' TOKEN REFRESH LOGIC TESTS');
  log('cyan', `${'='.repeat(70)}`);
  
  const results = {
    refreshWithoutToken: false,
    refreshWithInvalidToken: false,
    protectedRouteWithoutAuth: false,
    loginEndpoint: false,
    sessionEndpoint: false,
  };

  try {
    results.refreshWithoutToken = await testRefreshWithoutToken();
    results.refreshWithInvalidToken = await testRefreshWithInvalidToken();
    results.protectedRouteWithoutAuth = await testProtectedRouteWithoutAuth();
    results.loginEndpoint = await testLoginEndpoint();
    results.sessionEndpoint = await testSessionEndpoint();
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

  // Analysis
  if (passedTests === totalTests) {
    log('green', '\n✓ All auth endpoints are working correctly!');
    log('blue', '\nTo test the full token refresh flow:');
    log('blue', '  1. Create a valid test user in the external API');
    log('blue', '  2. Run the token-debug.test.mjs with valid credentials');
    log('blue', '  3. Check that tokens are properly stored and refreshed');
  } else {
    log('yellow', '\n⚠ Some tests failed. Check the following:');
    
    if (!results.refreshWithoutToken || !results.refreshWithInvalidToken) {
      log('red', '   - Refresh endpoint may not be handling tokens correctly');
    }
    
    if (!results.protectedRouteWithoutAuth) {
      log('red', '   - Protected routes may not be checking authentication');
    }
    
    if (!results.loginEndpoint) {
      log('red', '   - Login endpoint may not be working');
    }
    
    if (!results.sessionEndpoint) {
      log('red', '   - Session endpoint may not be working');
    }
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runTests();
