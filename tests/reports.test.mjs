/**
 * Reports API Test Suite
 * Tests all report endpoints and their proxy APIs
 * 
 * Run this test with: node tests/reports.test.mjs
 * Make sure dev server is running: npm run dev
 */

const BASE_URL = 'http://localhost:3000';

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

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

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

function cookiesToHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

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
  const setCookieHeaders = response.headers.getSetCookie?.() || response.headers.get('set-cookie');
  const cookies = parseCookies(setCookieHeaders);

  return {
    cookies,
    csrfToken: data.data?.csrfToken || cookies.csrf_token,
    user: data.data?.user,
  };
}

async function authenticatedFetch(endpoint, session, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': cookiesToHeader(session.cookies),
    ...options.headers
  };

  const method = options.method || 'GET';
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && session.csrfToken) {
    headers['X-CSRF-Token'] = session.csrfToken;
  }

  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
}

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

async function runTests() {
  console.log('\n========================================');
  console.log('REPORTS API TEST SUITE');
  console.log('========================================\n');

  console.log('Logging in test users...\n');

  let adminSession, hrSession, employeeSession;
  try {
    adminSession = await login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    console.log(`✓ Admin logged in`);
  } catch (error) {
    console.error('✗ Admin login failed:', error.message);
    process.exit(1);
  }

  try {
    hrSession = await login(TEST_USERS.hrManager.email, TEST_USERS.hrManager.password);
    console.log(`✓ HR Manager logged in`);
  } catch (error) {
    console.error('✗ HR Manager login failed:', error.message);
    process.exit(1);
  }

  try {
    employeeSession = await login(TEST_USERS.employee.email, TEST_USERS.employee.password);
    console.log(`✓ Employee logged in`);
  } catch (error) {
    console.error('✗ Employee login failed:', error.message);
    process.exit(1);
  }

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  console.log('\n========================================');
  console.log('TESTING ACCESS CONTROL');
  console.log('========================================\n');

  await testAsync('Employee CANNOT access reports', async () => {
    const response = await authenticatedFetch(`/api/reports/attendance?startDate=${startDate}&endDate=${endDate}`, employeeSession);
    if (response.status !== 403 && response.status !== 401) {
      throw new Error(`Expected 403/401, got ${response.status}`);
    }
  });

  console.log('\n========================================');
  console.log('TESTING ATTENDANCE REPORTS');
  console.log('========================================\n');

  await testAsync('Attendance report requires date parameters', async () => {
    const response = await authenticatedFetch('/api/reports/attendance', adminSession);
    if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
  });

  await testAsync('Attendance report returns data with valid params', async () => {
    const response = await authenticatedFetch(`/api/reports/attendance?startDate=${startDate}&endDate=${endDate}`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Attendance report with department filter', async () => {
    const response = await authenticatedFetch(`/api/reports/attendance?startDate=${startDate}&endDate=${endDate}&department=Engineering`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Attendance export endpoint works', async () => {
    const response = await authenticatedFetch(`/api/reports/attendance/export?startDate=${startDate}&endDate=${endDate}&format=csv`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/csv') && !contentType?.includes('spreadsheet')) {
      throw new Error(`Expected CSV/Excel content type, got ${contentType}`);
    }
  });

  console.log('\n========================================');
  console.log('TESTING EMPLOYEE REPORTS');
  console.log('========================================\n');

  await testAsync('Employee report returns data', async () => {
    const response = await authenticatedFetch(`/api/reports/employee?startDate=${startDate}&endDate=${endDate}`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (typeof data.data?.totalEmployees !== 'number') throw new Error('Expected totalEmployees in response');
    if (typeof data.data?.activeEmployees !== 'number') throw new Error('Expected activeEmployees in response');
    if (typeof data.data?.newHires !== 'number') throw new Error('Expected newHires in response');
  });

  await testAsync('Employee report works without date params', async () => {
    const response = await authenticatedFetch('/api/reports/employee', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (!Array.isArray(data.data?.departmentBreakdown)) throw new Error('Expected departmentBreakdown array');
    if (!Array.isArray(data.data?.positionBreakdown)) throw new Error('Expected positionBreakdown array');
  });

  await testAsync('Employee report with department param (passed but may be ignored)', async () => {
    const response = await authenticatedFetch(`/api/reports/employee?startDate=${startDate}&endDate=${endDate}&department=Engineering`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Employee export endpoint works', async () => {
    const response = await authenticatedFetch(`/api/reports/employee/export?startDate=${startDate}&endDate=${endDate}&format=xlsx`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
  });

  await testAsync('Employee export as CSV works', async () => {
    const response = await authenticatedFetch(`/api/reports/employee/export?startDate=${startDate}&endDate=${endDate}&format=csv`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
  });

  console.log('\n========================================');
  console.log('TESTING PAYROLL REPORTS');
  console.log('========================================\n');

  await testAsync('Payroll report requires date parameters', async () => {
    const response = await authenticatedFetch('/api/reports/payroll', adminSession);
    if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
  });

  await testAsync('Payroll report returns data with valid params', async () => {
    const response = await authenticatedFetch(`/api/reports/payroll?startDate=${startDate}&endDate=${endDate}`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Payroll export endpoint works', async () => {
    const response = await authenticatedFetch(`/api/reports/payroll/export?startDate=${startDate}&endDate=${endDate}&format=csv`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
  });

  console.log('\n========================================');
  console.log('TESTING LEAVE REPORTS');
  console.log('========================================\n');

  await testAsync('Leave report requires date parameters', async () => {
    const response = await authenticatedFetch('/api/reports/leave', adminSession);
    if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
  });

  await testAsync('Leave report returns data with valid params', async () => {
    const response = await authenticatedFetch(`/api/reports/leave?startDate=${startDate}&endDate=${endDate}`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Leave export endpoint works', async () => {
    const response = await authenticatedFetch(`/api/reports/leave/export?startDate=${startDate}&endDate=${endDate}&format=xlsx`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
  });

  console.log('\n========================================');
  console.log('TESTING COMPREHENSIVE REPORT');
  console.log('========================================\n');

  await testAsync('Comprehensive report returns data', async () => {
    const response = await authenticatedFetch('/api/reports/comprehensive', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Comprehensive report with year/month params', async () => {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const response = await authenticatedFetch(`/api/reports/comprehensive?year=${year}&month=${month}`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (!data.data) throw new Error('Expected data in response');
  });

  console.log('\n========================================');
  console.log('TESTING LEAVE UTILIZATION REPORT');
  console.log('========================================\n');

  await testAsync('Leave utilization report returns paginated data', async () => {
    const response = await authenticatedFetch('/api/reports/leave-utilization?page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Leave utilization export works', async () => {
    const response = await authenticatedFetch('/api/reports/leave-utilization/export?format=csv', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
  });

  console.log('\n========================================');
  console.log('TESTING ATTENDANCE SUMMARY REPORT');
  console.log('========================================\n');

  await testAsync('Attendance summary requires month and year', async () => {
    const response = await authenticatedFetch('/api/reports/attendance-summary', adminSession);
    if (response.status !== 400 && response.status !== 500) {
      throw new Error(`Expected 400/500, got ${response.status}`);
    }
  });

  await testAsync('Attendance summary with valid params', async () => {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const response = await authenticatedFetch(`/api/reports/attendance-summary?month=${month}&year=${year}`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Attendance summary export works', async () => {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const response = await authenticatedFetch(`/api/reports/attendance-summary/export?month=${month}&year=${year}&format=csv`, adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
  });

  console.log('\n========================================');
  console.log('TESTING HR MANAGER ACCESS');
  console.log('========================================\n');

  await testAsync('HR Manager CAN access attendance report', async () => {
    const response = await authenticatedFetch(`/api/reports/attendance?startDate=${startDate}&endDate=${endDate}`, hrSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
  });

  await testAsync('HR Manager CAN access employee report', async () => {
    const response = await authenticatedFetch('/api/reports/employee', hrSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
  });

  await testAsync('HR Manager CAN access payroll report', async () => {
    const response = await authenticatedFetch(`/api/reports/payroll?startDate=${startDate}&endDate=${endDate}`, hrSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
  });

  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✓ Passed: ${passedTests}`);
  console.log(`✗ Failed: ${failedTests}`);

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);

  if (failedTests === 0) {
    console.log('All tests passed! Reports API is working correctly.\n');
    process.exit(0);
  } else {
    console.log('Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\nTest suite failed with error:');
  console.error(error);
  process.exit(1);
});
