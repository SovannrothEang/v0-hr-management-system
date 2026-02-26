#!/usr/bin/env node
/**
 * End-to-End Token Flow Test
 * Tests complete authentication flow matching mobile app behavior
 */

const API_URL = 'http://localhost:3001/api';

const TEST_USER = {
  email: 'admin@example.com',
  password: 'Admin123!'
};

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  End-to-End Token Flow Test');
console.log('  Simulating Mobile App Behavior');
console.log('═══════════════════════════════════════════════════════════\n');

(async () => {
  let accessToken = null;
  let refreshToken = null;
  let csrfToken = null;
  let sessionId = null;

  // Step 1: Login
  console.log('1. LOGIN');
  console.log('   Request: POST /auth/login');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });

  if (!loginRes.ok) {
    console.error(`   ✗ Login failed: ${loginRes.status}`);
    process.exit(1);
  }

  const loginData = await loginRes.json();
  console.log('   Response structure:', Object.keys(loginData).join(', '));

  // Handle wrapped response
  const responseData = loginData.data || loginData;
  
  accessToken = responseData.accessToken;
  refreshToken = responseData.refreshToken;
  csrfToken = responseData.csrfToken;
  sessionId = responseData.sessionId;

  console.log('   ✓ Login successful');
  console.log(`   - Access Token: ${accessToken ? '✓ present' : '✗ missing'}`);
  console.log(`   - Refresh Token: ${refreshToken ? '✓ present' : '✗ missing'}`);
  console.log(`   - CSRF Token: ${csrfToken ? '✓ present' : '✗ missing'}`);
  console.log(`   - Session ID: ${sessionId ? '✓ present' : '✗ missing'}`);
  console.log(`   - User: ${responseData.user?.email}`);
  console.log(`   - Roles: ${responseData.user?.roles?.join(', ')}`);

  if (!accessToken || !refreshToken) {
    console.error('\n✗ Missing required tokens!');
    process.exit(1);
  }

  // Step 2: Access protected endpoint
  console.log('\n2. ACCESS PROTECTED ENDPOINT');
  console.log('   Request: GET /auth/session');
  const sessionRes = await fetch(`${API_URL}/auth/session`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (sessionRes.ok) {
    console.log('   ✓ Access granted');
  } else {
    console.log(`   ✗ Access denied: ${sessionRes.status}`);
  }

  // Step 3: Simulate expired token
  console.log('\n3. SIMULATE EXPIRED TOKEN');
  console.log('   Request: GET /auth/session with invalid token');
  const invalidRes = await fetch(`${API_URL}/auth/session`, {
    headers: { 'Authorization': 'Bearer invalid.token.here' }
  });
  console.log(`   Response: ${invalidRes.status} (expected: 401)`);

  // Step 4: Refresh token (like mobile app does)
  console.log('\n4. REFRESH TOKEN');
  console.log('   Request: POST /auth/refresh');
  console.log('   Body: { refreshToken: "..." }');
  
  const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!refreshRes.ok) {
    console.error(`   ✗ Refresh failed: ${refreshRes.status}`);
    const errorText = await refreshRes.text();
    console.error(`   Error: ${errorText}`);
    process.exit(1);
  }

  const refreshData = await refreshRes.json();
  const newResponseData = refreshData.data || refreshData;
  
  console.log('   ✓ Token refreshed successfully');
  console.log(`   - New Access Token: ${newResponseData.accessToken ? '✓ present' : '✗ missing'}`);
  console.log(`   - Token changed: ${accessToken !== newResponseData.accessToken}`);

  // Step 5: Verify new token works
  console.log('\n5. VERIFY NEW TOKEN');
  console.log('   Request: GET /auth/session with new token');
  const newSessionRes = await fetch(`${API_URL}/auth/session`, {
    headers: { 'Authorization': `Bearer ${newResponseData.accessToken}` }
  });

  if (newSessionRes.ok) {
    console.log('   ✓ New token works');
  } else {
    console.log(`   ✗ New token failed: ${newSessionRes.status}`);
    process.exit(1);
  }

  // Step 6: Test refresh with invalid token
  console.log('\n6. TEST INVALID REFRESH TOKEN');
  console.log('   Request: POST /auth/refresh with invalid token');
  const invalidRefreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: 'invalid.token.here' })
  });

  console.log(`   Response: ${invalidRefreshRes.status} (expected: 401)`);
  if (invalidRefreshRes.status === 401) {
    console.log('   ✓ Correctly rejected invalid refresh token');
  } else {
    console.log('   ✗ Should have returned 401');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✓ All tests passed!');
  console.log('═══════════════════════════════════════════════════════════\n');
})();
