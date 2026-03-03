/**
 * UI Permissions Test Suite
 * Tests that UI elements are properly hidden/shown based on user roles
 * 
 * Updated for cookie-based authentication with CSRF protection
 * 
 * Run this test with: node tests/ui-permissions.test.mjs
 * Make sure dev server is running: npm run dev
 */

const BASE_URL = 'http://localhost:3000';

// Test user credentials
const TEST_USERS = {
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
    name: 'Emily Rodriguez'
  },
  employee: {
    email: 'sarah.johnson@hrflow.com',
    password: 'emp123',
    role: 'employee',
    name: 'Sarah Johnson'
  }
};

// Track test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

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
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
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
}

/**
 * Make authenticated API request with cookies and CSRF token
 */
async function authenticatedFetch(endpoint, session, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': cookiesToHeader(session.cookies),
    ...options.headers
  };

  // Add CSRF token for state-changing requests
  const method = options.method || 'GET';
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && session.csrfToken) {
    headers['X-CSRF-Token'] = session.csrfToken;
  }

  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
}

// Test helper
function test(description, callback) {
  totalTests++;
  try {
    callback();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(`  Error: ${error.message}`);
    failedTests++;
  }
}

// Async test helper
async function testAsync(description, callback) {
  totalTests++;
  try {
    await callback();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(`  Error: ${error.message}`);
    failedTests++;
  }
}

// Test that a user can access an endpoint
async function testCanAccess(role, endpoint, session, description, method = 'GET', body = null) {
  await testAsync(description, async () => {
    const options = { method };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await authenticatedFetch(endpoint, session, options);
    // Accept 200-299, 400 (validation error - means access granted), 404 (not found - means access granted), 405 (method not allowed - means access granted)
    if (!response.ok && response.status !== 400 && response.status !== 404 && response.status !== 405) {
      throw new Error(`Expected ${role} to access ${endpoint}, got ${response.status}`);
    }
  });
}

// Test that a user cannot access an endpoint (should get 403)
async function testCannotAccess(role, endpoint, session, description, method = 'GET', body = null) {
  await testAsync(description, async () => {
    const options = { method };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await authenticatedFetch(endpoint, session, options);
    if (response.ok) {
      throw new Error(`Expected ${role} to be denied access to ${endpoint}, but request succeeded`);
    }
    // Must be 403 (forbidden) or 401 (unauthorized) - NOT 400, 404, or 405
    if (response.status !== 403 && response.status !== 401) {
      throw new Error(`Expected 403/401 for ${role} accessing ${endpoint}, got ${response.status}`);
    }
  });
}

// Main test suite
async function runTests() {
  console.log('\n========================================');
  console.log('UI PERMISSIONS TEST SUITE');
  console.log('(Cookie-based Auth with CSRF Protection)');
  console.log('========================================\n');

  // Login all users
  console.log('Logging in test users...\n');

  let adminSession, hrSession, employeeSession;

  try {
    adminSession = await login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    console.log(`✓ Admin logged in (CSRF token: ${adminSession.csrfToken ? 'received' : 'missing'})`);
  } catch (error) {
    console.error('✗ Admin login failed:', error.message);
    process.exit(1);
  }

  try {
    hrSession = await login(TEST_USERS.hrManager.email, TEST_USERS.hrManager.password);
    console.log(`✓ HR Manager logged in (CSRF token: ${hrSession.csrfToken ? 'received' : 'missing'})`);
  } catch (error) {
    console.error('✗ HR Manager login failed:', error.message);
    process.exit(1);
  }

  try {
    employeeSession = await login(TEST_USERS.employee.email, TEST_USERS.employee.password);
    console.log(`✓ Employee logged in (CSRF token: ${employeeSession.csrfToken ? 'received' : 'missing'})`);
  } catch (error) {
    console.error('✗ Employee login failed:', error.message);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('TESTING ADMIN PERMISSIONS');
  console.log('========================================\n');

  await testCanAccess('Admin', '/api/employees', adminSession,
    'Admin can access employees API');
  await testCanAccess('Admin', '/api/payrolls', adminSession,
    'Admin can access payroll API');
  await testCanAccess('Admin', '/api/payrolls/mark-paid', adminSession,
    'Admin can access mark-paid endpoint', 'POST', { ids: [] });
  await testCanAccess('Admin', '/api/reports/employee', adminSession,
    'Admin can access employee reports');
  await testCanAccess('Admin', '/api/leave-requests', adminSession,
    'Admin can access leave requests');
  await testCanAccess('Admin', '/api/leave-balances', adminSession,
    'Admin can access leave balances');

  console.log('\n========================================');
  console.log('TESTING HR MANAGER PERMISSIONS');
  console.log('========================================\n');

  await testCanAccess('HR Manager', '/api/employees', hrSession,
    'HR Manager can access employees API');
  await testCanAccess('HR Manager', '/api/payrolls', hrSession,
    'HR Manager can access payroll API');
  await testCannotAccess('HR Manager', '/api/payrolls/mark-paid', hrSession,
    'HR Manager CANNOT mark payroll as paid (admin only)', 'POST', { ids: [] });
  await testCanAccess('HR Manager', '/api/reports/employee', hrSession,
    'HR Manager can access employee reports');
  await testCanAccess('HR Manager', '/api/leave-requests', hrSession,
    'HR Manager can access leave requests');
  await testCanAccess('HR Manager', '/api/leave-balances', hrSession,
    'HR Manager can access leave balances');

  console.log('\n========================================');
  console.log('TESTING EMPLOYEE PERMISSIONS');
  console.log('========================================\n');

  await testCannotAccess('Employee', '/api/employees', employeeSession,
    'Employee CANNOT access employees API');
  await testCannotAccess('Employee', '/api/payrolls', employeeSession,
    'Employee CANNOT access payroll API');
  await testCannotAccess('Employee', '/api/payrolls/mark-paid', employeeSession,
    'Employee CANNOT mark payroll as paid', 'POST', { ids: [] });
  await testCannotAccess('Employee', '/api/reports/employee', employeeSession,
    'Employee CANNOT access employee reports');
  await testCanAccess('Employee', '/api/leave-requests', employeeSession,
    'Employee CAN access leave requests (filtered to their own)');
  await testCannotAccess('Employee', '/api/leave-balances', employeeSession,
    'Employee CANNOT access leave balances');
  await testCanAccess('Employee', '/api/attendances', employeeSession,
    'Employee CAN access attendance API');
  await testCanAccess('Employee', '/api/dashboard/stats', employeeSession,
    'Employee CAN access dashboard stats');

  console.log('\n========================================');
  console.log('TESTING PAYROLL-SPECIFIC PERMISSIONS');
  console.log('========================================\n');

  // Test payroll generation
  await testCanAccess('Admin', '/api/payrolls/generate', adminSession,
    'Admin can generate payroll', 'POST', { month: 'January', year: 2026 });
  await testCanAccess('HR Manager', '/api/payrolls/generate', hrSession,
    'HR Manager can generate payroll', 'POST', { month: 'January', year: 2026 });
  await testCannotAccess('Employee', '/api/payrolls/generate', employeeSession,
    'Employee CANNOT generate payroll', 'POST', { month: 'January', year: 2026 });

  // Test payroll processing
  await testCanAccess('Admin', '/api/payrolls/process', adminSession,
    'Admin can process payroll', 'POST', { ids: [] });
  await testCanAccess('HR Manager', '/api/payrolls/process', hrSession,
    'HR Manager can process payroll', 'POST', { ids: [] });
  await testCannotAccess('Employee', '/api/payrolls/process', employeeSession,
    'Employee CANNOT process payroll', 'POST', { ids: [] });

  console.log('\n========================================');
  console.log('TESTING EMPLOYEE MANAGEMENT PERMISSIONS');
  console.log('========================================\n');

  // Test employee deletion (skip specific ID tests - just verify GET access works)
  console.log('  (Skipping specific employee ID tests - testing access control only)');


  console.log('\n========================================');
  console.log('TESTING REPORT ACCESS PERMISSIONS');
  console.log('========================================\n');

  const reportEndpoints = [
    '/api/reports/employee?month=January&year=2026',
    '/api/reports/attendances?startDate=2026-01-01&endDate=2026-01-31',
    '/api/reports/payrolls?month=January&year=2026',
    '/api/reports/leave?startDate=2026-01-01&endDate=2026-01-31',
    '/api/reports/comprehensive?month=January&year=2026'
  ];

  const reportNames = ['employee', 'attendance', 'payroll', 'leave', 'comprehensive'];

  for (let i = 0; i < reportEndpoints.length; i++) {
    const endpoint = reportEndpoints[i];
    const reportType = reportNames[i];
    await testCanAccess('Admin', endpoint, adminSession,
      `Admin can access ${reportType} report`);
    await testCanAccess('HR Manager', endpoint, hrSession,
      `HR Manager can access ${reportType} report`);
    await testCannotAccess('Employee', endpoint, employeeSession,
      `Employee CANNOT access ${reportType} report`);
  }

  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✓ Passed: ${passedTests}`);
  console.log(`✗ Failed: ${failedTests}`);

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);

  if (failedTests === 0) {
    console.log('All tests passed! UI permissions are working correctly.\n');
    process.exit(0);
  } else {
    console.log('Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('\nTest suite failed with error:');
  console.error(error);
  process.exit(1);
});
