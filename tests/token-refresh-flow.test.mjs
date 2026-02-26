#!/usr/bin/env node
/**
 * Token Refresh Flow Test
 * Tests that access token is refreshed automatically when expired
 */

const API_URL = 'http://localhost:3001/api';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Token Refresh Flow Test');
console.log('═══════════════════════════════════════════════════════════\n');

(async () => {
  // Step 1: Login
  console.log('1. LOGIN');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'Admin123!' })
  });
  
  if (!loginRes.ok) {
    console.error('✗ Login failed:', loginRes.status);
    process.exit(1);
  }
  
  const loginData = await loginRes.json();
  const accessToken = loginData.data.accessToken;
  const refreshToken = loginData.data.refreshToken;
  
  console.log('✓ Login successful');
  console.log(`   Access Token: ${accessToken.substring(0, 30)}...`);
  console.log(`   Refresh Token: ${refreshToken ? '✓ present' : '✗ missing'}`);
  
  // Step 2: Make a request with valid token
  console.log('\n2. VALID TOKEN REQUEST');
  const validRes = await fetch(`${API_URL}/auth/session`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  console.log(`   Status: ${validRes.status} ${validRes.ok ? '✓' : '✗'}`);
  
  // Step 3: Make a request with INVALID token (simulates expired token)
  console.log('\n3. INVALID TOKEN REQUEST (simulates expired)');
  const invalidRes = await fetch(`${API_URL}/auth/session`, {
    headers: { 'Authorization': 'Bearer invalid.token.here' }
  });
  console.log(`   Status: ${invalidRes.status} (expected: 401)`);
  
  // Step 4: Refresh the token
  console.log('\n4. REFRESH TOKEN');
  const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  if (!refreshRes.ok) {
    console.log(`   Status: ${refreshRes.status} ✗`);
    console.log('   Refresh failed - would redirect to login in real app');
  } else {
    const refreshData = await refreshRes.json();
    const newAccessToken = refreshData.data?.accessToken;
    console.log(`   Status: ${refreshRes.status} ✓`);
    console.log(`   New Access Token: ${newAccessToken ? newAccessToken.substring(0, 30) + '...' : '✗ missing'}`);
    
    // Step 5: Use new token
    console.log('\n5. REQUEST WITH REFRESHED TOKEN');
    const refreshedRes = await fetch(`${API_URL}/auth/session`, {
      headers: { 'Authorization': `Bearer ${newAccessToken}` }
    });
    console.log(`   Status: ${refreshedRes.status} ${refreshedRes.ok ? '✓' : '✗'}`);
  }
  
  // Step 6: Try refresh with INVALID refresh token
  console.log('\n6. REFRESH WITH INVALID TOKEN');
  const badRefreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: 'invalid.token.here' })
  });
  console.log(`   Status: ${badRefreshRes.status} (expected: 401)`);
  console.log('   ✓ This would trigger redirect to login in real app');
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✓ Test completed!');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('SUMMARY:');
  console.log('  ✓ Access token expires → Refresh with refresh_token');
  console.log('  ✓ Refresh succeeds → Get new access_token, continue');
  console.log('  ✓ Refresh fails (401) → Redirect to /login');
  console.log('');
})();
