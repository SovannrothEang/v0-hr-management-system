#!/usr/bin/env node
/**
 * Authentication & Authorization Test Script
 * Tests all 3 roles against protected API routes
 * 
 * Updated for cookie-based authentication with CSRF protection
 */

const BASE_URL = 'http://localhost:3000';

// Test users
const USERS = {
  admin: {
    email: 'admin@hrflow.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  hrManager: {
    email: 'hr@hrflow.com',
    password: 'hr123',
    role: 'hr_manager',
    name: 'Emily Rodriguez',
    department: 'Human Resources'
  },
  employee: {
    email: 'sarah.johnson@hrflow.com',
    password: 'emp123',
    role: 'employee',
    name: 'Sarah Johnson',
    department: 'Engineering'
  }
};

// API endpoints to test
const TEST_ROUTES = {
  // Admin & HR Manager only
  adminHrOnly: [
    { method: 'GET', path: '/api/employees', name: 'List Employees' },
    { method: 'GET', path: '/api/payroll', name: 'List Payroll' },
    { method: 'GET', path: '/api/reports/employee?startDate=2024-01-01&endDate=2024-12-31', name: 'Employee Report' },
    { method: 'GET', path: '/api/dashboard/attendance-trend', name: 'Attendance Trend' },
  ],
  // Admin only
  adminOnly: [
    { method: 'POST', path: '/api/payroll/mark-paid', name: 'Mark Payroll Paid', body: { ids: ['test'] } },
  ],
  // All authenticated users
  allAuth: [
    { method: 'GET', path: '/api/dashboard/stats', name: 'Dashboard Stats' },
    { method: 'GET', path: '/api/departments', name: 'List Departments' },
    { method: 'GET', path: '/api/leave-requests', name: 'List Leave Requests' },
  ],
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
    const parts = header.split(';')[0]; // Get cookie=value part
    const [name, ...valueParts] = parts.split('=');
    cookies[name.trim()] = valueParts.join('='); // Handle values with = in them
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
 * Login and return session info (cookies + CSRF token)
 */
async function login(user) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse cookies from Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
    const cookies = parseCookies(setCookieHeaders);
    
    return {
      cookies,
      csrfToken: data.data?.csrfToken || cookies.csrf_token,
      user: data.data?.user,
    };
  } catch (error) {
    throw new Error(`Login error: ${error.message}`);
  }
}

/**
 * Test a route with cookie-based authentication
 */
async function testRoute(route, session, expectSuccess) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': cookiesToHeader(session.cookies),
    };
    
    // Add CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(route.method) && session.csrfToken) {
      headers['X-CSRF-Token'] = session.csrfToken;
    }

    const options = {
      method: route.method,
      headers,
    };

    if (route.body) {
      options.body = JSON.stringify(route.body);
    }

    const response = await fetch(`${BASE_URL}${route.path}`, options);
    const status = response.status;

    if (expectSuccess && status === 200) {
      return { success: true, status, message: 'Access granted' };
    } else if (!expectSuccess && (status === 403 || status === 401)) {
      return { success: true, status, message: 'Access denied (as expected)' };
    } else {
      return { success: false, status, message: `Unexpected status: ${status}` };
    }
  } catch (error) {
    return { success: false, status: 'ERROR', message: error.message };
  }
}

async function testUser(userType, user) {
  log('cyan', `\n${'='.repeat(60)}`);
  log('cyan', `Testing: ${user.name} (${user.role})`);
  log('cyan', '='.repeat(60));

  // Login
  log('blue', '\n1. Login...');
  let session;
  try {
    session = await login(user);
    log('green', `   ✓ Login successful - Session cookies received`);
    if (session.csrfToken) {
      log('green', `   ✓ CSRF token received`);
    }
  } catch (error) {
    log('red', `   ✗ Login failed: ${error.message}`);
    return;
  }

  // Test Admin & HR Manager routes
  log('blue', '\n2. Testing Admin & HR Manager routes...');
  const shouldAccessAdminHr = userType === 'admin' || userType === 'hrManager';
  for (const route of TEST_ROUTES.adminHrOnly) {
    const result = await testRoute(route, session, shouldAccessAdminHr);
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    log(color, `   ${icon} ${route.name}: ${result.message} (${result.status})`);
  }

  // Test Admin only routes
  log('blue', '\n3. Testing Admin-only routes...');
  const shouldAccessAdmin = userType === 'admin';
  for (const route of TEST_ROUTES.adminOnly) {
    const result = await testRoute(route, session, shouldAccessAdmin);
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    log(color, `   ${icon} ${route.name}: ${result.message} (${result.status})`);
  }

  // Test all authenticated routes
  log('blue', '\n4. Testing routes for all authenticated users...');
  for (const route of TEST_ROUTES.allAuth) {
    const result = await testRoute(route, session, true);
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    log(color, `   ${icon} ${route.name}: ${result.message} (${result.status})`);
  }
}

async function testWithoutAuth() {
  log('cyan', `\n${'='.repeat(60)}`);
  log('cyan', 'Testing: Unauthenticated Access');
  log('cyan', '='.repeat(60));

  log('blue', '\nTesting protected route without cookies...');
  try {
    const response = await fetch(`${BASE_URL}/api/employees`);
    if (response.status === 401) {
      log('green', '   ✓ Correctly rejected (401 Unauthorized)');
    } else {
      log('red', `   ✗ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
  }
}

async function testCsrfProtection() {
  log('cyan', `\n${'='.repeat(60)}`);
  log('cyan', 'Testing: CSRF Protection');
  log('cyan', '='.repeat(60));

  // Login as admin first
  log('blue', '\n1. Login as admin...');
  let session;
  try {
    session = await login(USERS.admin);
    log('green', '   ✓ Login successful');
  } catch (error) {
    log('red', `   ✗ Login failed: ${error.message}`);
    return;
  }

  // Test POST without CSRF token
  log('blue', '\n2. Testing POST without CSRF token...');
  try {
    const response = await fetch(`${BASE_URL}/api/payroll/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookiesToHeader(session.cookies),
        // No X-CSRF-Token header
      },
      body: JSON.stringify({ ids: ['test'] }),
    });
    
    if (response.status === 403) {
      log('green', '   ✓ Correctly rejected (403 - CSRF validation failed)');
    } else if (response.status === 200) {
      log('yellow', `   ~ Request succeeded (CSRF may be disabled or optional)`);
    } else {
      log('red', `   ✗ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
  }

  // Test POST with wrong CSRF token
  log('blue', '\n3. Testing POST with invalid CSRF token...');
  try {
    const response = await fetch(`${BASE_URL}/api/payroll/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookiesToHeader(session.cookies),
        'X-CSRF-Token': 'invalid-token-12345',
      },
      body: JSON.stringify({ ids: ['test'] }),
    });
    
    if (response.status === 403) {
      log('green', '   ✓ Correctly rejected (403 - Invalid CSRF token)');
    } else if (response.status === 200) {
      log('yellow', `   ~ Request succeeded (CSRF validation may be lenient)`);
    } else {
      log('red', `   ✗ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
  }

  // Test POST with correct CSRF token
  log('blue', '\n4. Testing POST with valid CSRF token...');
  try {
    const response = await fetch(`${BASE_URL}/api/payroll/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookiesToHeader(session.cookies),
        'X-CSRF-Token': session.csrfToken,
      },
      body: JSON.stringify({ ids: ['test'] }),
    });
    
    if (response.status === 200) {
      log('green', '   ✓ Request succeeded with valid CSRF token');
    } else if (response.status === 400) {
      log('green', '   ✓ Request accepted (400 = validation error, not auth error)');
    } else {
      log('red', `   ✗ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
  }
}

async function testSessionEndpoint() {
  log('cyan', `\n${'='.repeat(60)}`);
  log('cyan', 'Testing: Session Validation Endpoint');
  log('cyan', '='.repeat(60));

  // Test without session
  log('blue', '\n1. Testing /api/auth/session without cookies...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/session`);
    const data = await response.json();
    
    if (response.status === 401 || data.authenticated === false) {
      log('green', '   ✓ Correctly returns unauthenticated');
    } else {
      log('red', `   ✗ Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
  }

  // Login and test with session
  log('blue', '\n2. Testing /api/auth/session with valid cookies...');
  try {
    const session = await login(USERS.admin);
    const response = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': cookiesToHeader(session.cookies),
      },
    });
    const data = await response.json();
    
    if (response.status === 200 && data.authenticated === true && data.user) {
      log('green', `   ✓ Session validated - User: ${data.user.name}`);
    } else {
      log('red', `   ✗ Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    log('red', `   ✗ Error: ${error.message}`);
  }
}

async function runTests() {
  log('yellow', '\n╔═══════════════════════════════════════════════════════════╗');
  log('yellow', '║  HR Management System - Authentication & RBAC Tests       ║');
  log('yellow', '║  (Cookie-based Auth with CSRF Protection)                 ║');
  log('yellow', '╚═══════════════════════════════════════════════════════════╝');

  // Check if server is running
  try {
    await fetch(`${BASE_URL}/api/auth/login`);
  } catch (error) {
    log('red', '\n✗ Error: Development server is not running!');
    log('yellow', '\nPlease start the server first:');
    log('blue', '  npm run dev\n');
    process.exit(1);
  }

  // Test unauthenticated access
  await testWithoutAuth();

  // Test session endpoint
  await testSessionEndpoint();

  // Test CSRF protection
  await testCsrfProtection();

  // Test each user role
  await testUser('admin', USERS.admin);
  await testUser('hrManager', USERS.hrManager);
  await testUser('employee', USERS.employee);

  // Summary
  log('yellow', `\n${'='.repeat(60)}`);
  log('yellow', 'Test Summary');
  log('yellow', '='.repeat(60));
  log('green', '\n✓ All tests completed!');
  log('cyan', '\nExpected Behavior:');
  log('blue', '  - Admin: Access to all routes');
  log('blue', '  - HR Manager: Access to admin/hr routes (not admin-only)');
  log('blue', '  - Employee: Access to basic routes only');
  log('blue', '  - No cookies: All requests denied (401)');
  log('blue', '  - Invalid CSRF: Mutation requests denied (403)');
  log('yellow', '\n');
}

runTests().catch(error => {
  log('red', `\nFatal error: ${error.message}`);
  process.exit(1);
});
