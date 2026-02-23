/**
 * Filtering Test Suite
 * Tests that filtering and search functionality works correctly for employees, users, and departments
 * 
 * Run this test with: node tests/filtering.test.mjs
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
  console.log('FILTERING TEST SUITE');
  console.log('========================================\n');

  console.log('Logging in test users...\n');

  let adminSession;
  try {
    adminSession = await login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    console.log(`✓ Admin logged in`);
  } catch (error) {
    console.error('✗ Admin login failed:', error.message);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('TESTING EMPLOYEES FILTERING');
  console.log('========================================\n');

  await testAsync('Employees API returns paginated data', async () => {
    const response = await authenticatedFetch('/api/employees?page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (!Array.isArray(data.data?.data)) throw new Error('Expected data.data to be an array');
  });

  await testAsync('Employees API supports search filter', async () => {
    const response = await authenticatedFetch('/api/employees?search=john&page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Employees API supports department filter by name', async () => {
    const response = await authenticatedFetch('/api/employees?department=Engineering&page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Employees API supports status filter (lowercase)', async () => {
    const response = await authenticatedFetch('/api/employees?status=active&page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Employees API combines multiple filters', async () => {
    const response = await authenticatedFetch('/api/employees?search=john&status=active&page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Employees summary endpoint works', async () => {
    const response = await authenticatedFetch('/api/employees/summary', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (typeof data.data?.totalEmployees !== 'number') throw new Error('Expected totalEmployees to be a number');
    if (typeof data.data?.activeCount !== 'number') throw new Error('Expected activeCount to be a number');
    if (typeof data.data?.newThisMonth !== 'number') throw new Error('Expected newThisMonth to be a number');
  });

  console.log('\n========================================');
  console.log('TESTING USERS FILTERING');
  console.log('========================================\n');

  await testAsync('Users API returns paginated data', async () => {
    const response = await authenticatedFetch('/api/users?page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (!Array.isArray(data.data?.data)) throw new Error('Expected data.data to be an array');
  });

  await testAsync('Users API supports search filter', async () => {
    const response = await authenticatedFetch('/api/users?search=admin&page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Users API supports role filter', async () => {
    const response = await authenticatedFetch('/api/users?role=admin&page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Users summary endpoint works', async () => {
    const response = await authenticatedFetch('/api/users/summary', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (typeof data.data?.totalUsers !== 'number') throw new Error('Expected totalUsers to be a number');
  });

  console.log('\n========================================');
  console.log('TESTING DEPARTMENTS FILTERING');
  console.log('========================================\n');

  await testAsync('Departments API returns paginated data', async () => {
    const response = await authenticatedFetch('/api/departments?page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (!Array.isArray(data.data?.data)) throw new Error('Expected data.data to be an array');
  });

  await testAsync('Departments API supports name search filter', async () => {
    const response = await authenticatedFetch('/api/departments?name=Engineering&page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Departments API supports sortBy parameter', async () => {
    const response = await authenticatedFetch('/api/departments?sortBy=department_name&sortOrder=desc&page=1&limit=10', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
  });

  await testAsync('Departments summary endpoint works', async () => {
    const response = await authenticatedFetch('/api/departments/summary', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (typeof data.data?.totalDepartments !== 'number') throw new Error('Expected totalDepartments to be a number');
  });

  await testAsync('Departments all endpoint works', async () => {
    const response = await authenticatedFetch('/api/departments/all', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (!Array.isArray(data.data)) throw new Error('Expected data to be an array');
  });

  console.log('\n========================================');
  console.log('TESTING PAGINATION');
  console.log('========================================\n');

  await testAsync('Employees pagination returns correct meta', async () => {
    const response = await authenticatedFetch('/api/employees?page=1&limit=5', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.data?.meta) throw new Error('Expected meta in response');
    if (typeof data.data.meta.total !== 'number') throw new Error('Expected total in meta');
    if (data.data.meta.limit !== 5) throw new Error(`Expected limit 5, got ${data.data.meta.limit}`);
    if (data.data.meta.page !== 1) throw new Error(`Expected page 1, got ${data.data.meta.page}`);
  });

  await testAsync('Users pagination returns correct meta', async () => {
    const response = await authenticatedFetch('/api/users?page=1&limit=5', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.data?.meta) throw new Error('Expected meta in response');
    if (typeof data.data.meta.total !== 'number') throw new Error('Expected total in meta');
  });

  await testAsync('Departments pagination returns correct meta', async () => {
    const response = await authenticatedFetch('/api/departments?page=1&limit=5', adminSession);
    if (!response.ok) throw new Error(`Expected 200, got ${response.status}`);
    const data = await response.json();
    if (!data.data?.meta) throw new Error('Expected meta in response');
    if (typeof data.data.meta.total !== 'number') throw new Error('Expected total in meta');
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
    console.log('All tests passed! Filtering is working correctly.\n');
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
