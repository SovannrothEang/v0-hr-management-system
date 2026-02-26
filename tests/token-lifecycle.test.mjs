#!/usr/bin/env node
/**
 * Token Lifecycle Test Suite
 * Tests: Creation → Storage → Usage → Refresh → Expiration → Logout
 */

const BASE_URL = 'http://localhost:3000'; // Frontend proxy
const API_URL = 'http://localhost:3001/api'; // Backend API direct

const TEST_USERS = {
  admin: { email: 'admin@example.com', password: 'Admin123!' },
  machine: { email: 'machine@example.com', password: 'Machine123!' }
};

// Test results tracking
const results = [];

function log(type, message) {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type] || ''}${message}${colors.reset}`);
}

async function runTest(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    log('success', `✓ ${name}`);
    return true;
  } catch (error) {
    results.push({ name, status: 'FAIL', error: error.message });
    log('error', `✗ ${name}: ${error.message}`);
    return false;
  }
}

// Global storage for test data
const testData = {};

// Run all tests
console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Token Lifecycle Test Suite');
console.log('═══════════════════════════════════════════════════════════\n');

(async () => {
  // Test 1: Direct Backend Login
  await runTest('1. Direct Backend Login (Port 3001)', async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USERS.admin)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Login failed: ${response.status} ${error}`);
    }
    
    const data = await response.json();
    if (!data.data?.accessToken) {
      throw new Error('No access token in response');
    }
    
    testData.accessToken = data.data.accessToken;
    testData.refreshToken = data.data.refreshToken;
    testData.csrfToken = data.data.csrfToken;
    
    log('info', `   Token received: ${testData.accessToken.substring(0, 30)}...`);
  });

  // Test 2: Access Token Structure
  await runTest('2. Access Token Structure', async () => {
    if (!testData.accessToken) throw new Error('No access token available');
    
    const parts = testData.accessToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format (should have 3 parts)');
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    log('info', `   Payload: sub=${payload.sub}, email=${payload.email}`);
    log('info', `   Roles: ${JSON.stringify(payload.roles)}`);
    
    if (!payload.sub || !payload.email || !payload.roles) {
      throw new Error('Token missing required claims (sub, email, roles)');
    }
    
    if (!payload.exp) {
      throw new Error('Token missing expiration (exp) claim');
    }
    
    const expDate = new Date(payload.exp * 1000);
    log('info', `   Expires: ${expDate.toISOString()}`);
  });

  // Test 3: Protected Endpoint Access
  await runTest('3. Access Protected Endpoint with Token', async () => {
    if (!testData.accessToken) throw new Error('No access token available');
    
    const response = await fetch(`${API_URL}/auth/session`, {
      headers: { 'Authorization': `Bearer ${testData.accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Session check failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.data) {
      throw new Error('No user data in session response');
    }
    
    log('info', `   User: ${data.data.email}`);
  });

  // Test 4: Token Refresh
  await runTest('4. Refresh Access Token', async () => {
    if (!testData.refreshToken) throw new Error('No refresh token available');
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: testData.refreshToken })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Refresh failed: ${response.status} ${error}`);
    }
    
    const data = await response.json();
    if (!data.data?.accessToken) {
      throw new Error('No new access token in refresh response');
    }
    
    testData.newAccessToken = data.data.accessToken;
    testData.newRefreshToken = data.data.refreshToken;
    
    log('info', `   New token: ${testData.newAccessToken.substring(0, 30)}...`);
    log('info', `   Token changed: ${testData.accessToken !== testData.newAccessToken}`);
  });

  // Test 5: New Token Works
  await runTest('5. Verify New Access Token Works', async () => {
    if (!testData.newAccessToken) throw new Error('No new access token available');
    
    const response = await fetch(`${API_URL}/auth/session`, {
      headers: { 'Authorization': `Bearer ${testData.newAccessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Session check with new token failed: ${response.status}`);
    }
  });

  // Test 6: Old Token Should Still Work (until expiration)
  await runTest('6. Verify Old Token Still Works (JWT stateless)', async () => {
    if (!testData.accessToken) throw new Error('No old access token available');
    
    const response = await fetch(`${API_URL}/auth/session`, {
      headers: { 'Authorization': `Bearer ${testData.accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Old token should still work: ${response.status}`);
    }
  });

  // Test 7: Machine User Login
  await runTest('7. Machine User Login (HRMS_API role)', async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USERS.machine)
    });
    
    if (!response.ok) {
      throw new Error(`Machine login failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.data?.user?.roles?.includes('HRMS_API')) {
      throw new Error('Machine user missing HRMS_API role');
    }
    
    testData.machineToken = data.data.accessToken;
    testData.machineRefreshToken = data.data.refreshToken;
    
    log('info', `   Machine token: ${testData.machineToken.substring(0, 30)}...`);
  });

  // Test 8: Machine User Access QR Endpoint
  await runTest('8. Machine User Access QR Generation', async () => {
    if (!testData.machineToken) throw new Error('No machine token available');
    
    const response = await fetch(`${API_URL}/attendances/qr/in`, {
      headers: { 'Authorization': `Bearer ${testData.machineToken}` }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`QR access failed: ${response.status} ${error}`);
    }
    
    const data = await response.json();
    const token = data.data?.token || data.token;
    if (!token) {
      throw new Error('No QR token in response');
    }
    
    log('info', `   QR token received: ${token.substring(0, 30)}...`);
  });

  // Test 9: Machine User Token Refresh
  await runTest('9. Machine User Token Refresh', async () => {
    if (!testData.machineRefreshToken) throw new Error('No machine refresh token');
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: testData.machineRefreshToken })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Machine refresh failed: ${response.status} ${error}`);
    }
    
    log('info', '   Machine token refreshed successfully');
  });

  // Test 10: Invalid Token Rejection
  await runTest('10. Invalid Token Rejected', async () => {
    const response = await fetch(`${API_URL}/auth/session`, {
      headers: { 'Authorization': 'Bearer invalid.token.here' }
    });
    
    if (response.ok) {
      throw new Error('Invalid token should be rejected');
    }
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}\n`);
  
  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    log('success', 'All tests passed!');
  }
})();
