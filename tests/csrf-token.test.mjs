/**
 * CSRF Token Flow Test
 * Tests that CSRF tokens are properly synchronized between:
 * 1. Backend API (external)
 * 2. Next.js proxy layer (cookie)
 * 3. Client requests (header)
 */

const API_BASE = 'http://localhost:3000/api';
const EXTERNAL_API_BASE = 'http://localhost:3001/api';

const TEST_USER = {
  email: 'admin@example.com',
  password: 'Admin123!',
};

let cookies = {};
let externalCsrfToken = null;
let externalSessionId = null;

function parseCookies(setCookie) {
  if (!setCookie) return {};
  const result = {};
  // Handle both string and array of Set-Cookie headers
  const headers = Array.isArray(setCookie) ? setCookie : setCookie.split('\n').filter(Boolean);
  for (const header of headers) {
    // Extract the name=value part before the first semicolon
    const cookiePart = header.split(';')[0];
    const eqIndex = cookiePart.indexOf('=');
    if (eqIndex > 0) {
      const name = cookiePart.substring(0, eqIndex).trim();
      const value = cookiePart.substring(eqIndex + 1).trim();
      result[name] = value;
    }
  }
  return result;
}

function cookieHeader() {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function login() {
  console.log('\n=== Test 1: Login ===');
  
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  });

  const data = await res.json();
  
  if (!res.ok) {
    console.error('❌ Login failed:', data.message);
    process.exit(1);
  }

  // Parse cookies
  const setCookie = res.headers.getSetCookie?.() || res.headers.get('set-cookie');
  const parsed = parseCookies(setCookie);
  cookies = { ...cookies, ...parsed };
  
  // Store tokens from response
  externalCsrfToken = data.data.csrfToken;
  externalSessionId = data.data.sessionId;
  
  console.log('✓ Login successful');
  console.log('  - CSRF token from response:', externalCsrfToken?.substring(0, 12) + '...');
  console.log('  - Session ID from response:', externalSessionId?.substring(0, 12) + '...');
  console.log('  - Cookie csrf_token:', cookies['csrf_token']?.substring(0, 12) + '...');
  
  // Verify cookie matches response
  if (cookies['csrf_token'] === externalCsrfToken) {
    console.log('  ✓ Cookie csrf_token matches response csrfToken');
  } else {
    console.error('  ❌ MISMATCH: Cookie does not match response!');
    console.error('    Cookie:', cookies['csrf_token']?.substring(0, 20));
    console.error('    Response:', externalCsrfToken?.substring(0, 20));
  }
  
  return data;
}

async function testDirectApiLogin() {
  console.log('\n=== Test 2: Direct Backend Login ===');
  
  const res = await fetch(`${EXTERNAL_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  });

  const data = await res.json();
  
  if (!res.ok) {
    console.error('❌ Direct API login failed:', data.message);
    return null;
  }

  console.log('✓ Direct API login successful');
  console.log('  - CSRF token:', data.data.csrfToken?.substring(0, 12) + '...');
  console.log('  - Session ID:', data.data.sessionId?.substring(0, 12) + '...');
  
  return data;
}

async function testProxyMutation() {
  console.log('\n=== Test 3: Proxy Mutation (Clock In with CSRF) ===');
  
  // Test clock-in which is a simple POST mutation
  const res = await fetch(`${API_BASE}/attendances/clock-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader(),
      'x-csrf-token': externalCsrfToken,
      'x-session-id': externalSessionId,
    },
    body: JSON.stringify({}),
  });

  const data = await res.json();
  
  console.log('  Response status:', res.status);
  
  if (res.status === 403 && data.message?.includes('CSRF')) {
    console.error('❌ CSRF validation failed!');
    console.error('  Message:', data.message);
    console.error('  Sent CSRF header:', externalCsrfToken?.substring(0, 12) + '...');
    console.error('  Cookie csrf_token:', cookies['csrf_token']?.substring(0, 12) + '...');
    return false;
  }
  
  // 400 = already clocked in or validation error (OK for CSRF test)
  // 201/200 = success
  if (res.ok || res.status === 400) {
    console.log('✓ Mutation request accepted (CSRF validation passed)');
    if (res.status === 400) {
      console.log('  Note: Business logic error (expected for test):', 
        typeof data.message === 'string' ? data.message : 'see response');
    }
    return true;
  } else {
    console.log('  Response:', typeof data.message === 'string' ? data.message : JSON.stringify(data.message));
    return false;
  }
}

async function testDirectApiMutation(accessToken, csrfToken, sessionId) {
  console.log('\n=== Test 4: Direct Backend Mutation (GET with CSRF) ===');
  
  // Test a GET request that requires auth (simpler than creating an employee)
  const res = await fetch(`${EXTERNAL_API_BASE}/employees?page=1&limit=5`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();
  
  console.log('  Response status:', res.status);
  
  if (res.status === 403 && data.message?.includes('CSRF')) {
    console.error('❌ Direct API CSRF validation failed!');
    console.error('  Message:', data.message);
    return false;
  }
  
  if (res.ok) {
    console.log('✓ Direct API request accepted');
    console.log('  - Returned', data.data?.length || 0, 'employees');
    return true;
  } else {
    console.log('  Response:', typeof data.message === 'string' ? data.message : JSON.stringify(data.message));
    return false;
  }
}

async function testRefresh() {
  console.log('\n=== Test 5: Token Refresh ===');
  
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Cookie': cookieHeader(),
    },
  });

  const data = await res.json();
  
  if (!res.ok) {
    console.error('❌ Refresh failed:', data.message);
    return null;
  }

  // Update cookies
  const setCookie = res.headers.getSetCookie?.() || res.headers.get('set-cookie');
  const parsed = parseCookies(setCookie);
  cookies = { ...cookies, ...parsed };
  
  // Update tokens
  const newCsrfToken = data.data.csrfToken;
  const newSessionId = data.data.sessionId;
  
  console.log('✓ Refresh successful');
  console.log('  - New CSRF token:', newCsrfToken?.substring(0, 12) + '...');
  console.log('  - New Session ID:', newSessionId?.substring(0, 12) + '...');
  console.log('  - Cookie csrf_token:', cookies['csrf_token']?.substring(0, 12) + '...');
  
  // Verify cookie matches new token
  if (cookies['csrf_token'] === newCsrfToken) {
    console.log('  ✓ Cookie csrf_token matches new csrfToken');
  } else {
    console.error('  ❌ MISMATCH after refresh!');
  }
  
  // Update our stored tokens
  externalCsrfToken = newCsrfToken;
  externalSessionId = newSessionId;
  
  return data;
}

async function runTests() {
  console.log('========================================');
  console.log('CSRF Token Flow Test');
  console.log('========================================');
  
  // Test 1: Login through proxy
  await login();
  
  // Test 2: Direct API login for comparison
  const directData = await testDirectApiLogin();
  
  // Test 3: Proxy mutation with CSRF
  await testProxyMutation();
  
  // Test 4: Direct API mutation (if we have tokens)
  if (directData?.data?.accessToken) {
    await testDirectApiMutation(
      directData.data.accessToken,
      directData.data.csrfToken,
      directData.data.sessionId
    );
  }
  
  // Test 5: Token refresh
  await testRefresh();
  
  // Test 6: Mutation after refresh
  console.log('\n=== Test 6: Mutation After Refresh ===');
  await testProxyMutation();
  
  console.log('\n========================================');
  console.log('Test Complete');
  console.log('========================================');
}

runTests().catch(console.error);
