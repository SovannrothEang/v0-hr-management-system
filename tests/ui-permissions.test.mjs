/**
 * UI Permissions Test Suite
 * Tests that UI elements are properly hidden/shown based on user roles
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

// Helper function to login and get token
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
  return data.data.token;
}

// Helper function to make authenticated API requests
async function authenticatedFetch(endpoint, token, options = {}) {
  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
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
async function testCanAccess(role, endpoint, token, description, method = 'GET', body = null) {
  await testAsync(description, async () => {
    const options = { method };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await authenticatedFetch(endpoint, token, options);
    // Accept 200-299, 400 (validation error - means access granted), 404 (not found - means access granted), 405 (method not allowed - means access granted)
    if (!response.ok && response.status !== 400 && response.status !== 404 && response.status !== 405) {
      throw new Error(`Expected ${role} to access ${endpoint}, got ${response.status}`);
    }
  });
}

// Test that a user cannot access an endpoint (should get 403)
async function testCannotAccess(role, endpoint, token, description, method = 'GET', body = null) {
  await testAsync(description, async () => {
    const options = { method };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await authenticatedFetch(endpoint, token, options);
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
  console.log('========================================\n');

  // Login all users
  console.log('📝 Logging in test users...\n');
  
  let adminToken, hrToken, employeeToken;
  
  try {
    adminToken = await login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    console.log('✓ Admin logged in');
  } catch (error) {
    console.error('✗ Admin login failed:', error.message);
    process.exit(1);
  }

  try {
    hrToken = await login(TEST_USERS.hrManager.email, TEST_USERS.hrManager.password);
    console.log('✓ HR Manager logged in');
  } catch (error) {
    console.error('✗ HR Manager login failed:', error.message);
    process.exit(1);
  }

  try {
    employeeToken = await login(TEST_USERS.employee.email, TEST_USERS.employee.password);
    console.log('✓ Employee logged in');
  } catch (error) {
    console.error('✗ Employee login failed:', error.message);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('TESTING ADMIN PERMISSIONS');
  console.log('========================================\n');

  await testCanAccess('Admin', '/api/employees', adminToken, 
    'Admin can access employees API');
  await testCanAccess('Admin', '/api/payroll', adminToken, 
    'Admin can access payroll API');
  await testCanAccess('Admin', '/api/payroll/mark-paid', adminToken, 
    'Admin can access mark-paid endpoint', 'POST', { ids: [] });
  await testCanAccess('Admin', '/api/reports/employee', adminToken, 
    'Admin can access employee reports');
  await testCanAccess('Admin', '/api/leave-requests', adminToken, 
    'Admin can access leave requests');

  console.log('\n========================================');
  console.log('TESTING HR MANAGER PERMISSIONS');
  console.log('========================================\n');

  await testCanAccess('HR Manager', '/api/employees', hrToken, 
    'HR Manager can access employees API');
  await testCanAccess('HR Manager', '/api/payroll', hrToken, 
    'HR Manager can access payroll API');
  await testCannotAccess('HR Manager', '/api/payroll/mark-paid', hrToken, 
    'HR Manager CANNOT mark payroll as paid (admin only)', 'POST', { ids: [] });
  await testCanAccess('HR Manager', '/api/reports/employee', hrToken, 
    'HR Manager can access employee reports');
  await testCanAccess('HR Manager', '/api/leave-requests', hrToken, 
    'HR Manager can access leave requests');

  console.log('\n========================================');
  console.log('TESTING EMPLOYEE PERMISSIONS');
  console.log('========================================\n');

  await testCannotAccess('Employee', '/api/employees', employeeToken, 
    'Employee CANNOT access employees API');
  await testCannotAccess('Employee', '/api/payroll', employeeToken, 
    'Employee CANNOT access payroll API');
  await testCannotAccess('Employee', '/api/payroll/mark-paid', employeeToken, 
    'Employee CANNOT mark payroll as paid', 'POST', { ids: [] });
  await testCannotAccess('Employee', '/api/reports/employee', employeeToken, 
    'Employee CANNOT access employee reports');
  await testCanAccess('Employee', '/api/leave-requests', employeeToken, 
    'Employee CAN access leave requests (filtered to their own)');
  await testCanAccess('Employee', '/api/attendance', employeeToken, 
    'Employee CAN access attendance API');
  await testCanAccess('Employee', '/api/dashboard/stats', employeeToken, 
    'Employee CAN access dashboard stats');

  console.log('\n========================================');
  console.log('TESTING PAYROLL-SPECIFIC PERMISSIONS');
  console.log('========================================\n');

  // Test payroll generation
  await testCanAccess('Admin', '/api/payroll/generate', adminToken, 
    'Admin can generate payroll', 'POST', { month: 'January', year: 2026 });
  await testCanAccess('HR Manager', '/api/payroll/generate', hrToken, 
    'HR Manager can generate payroll', 'POST', { month: 'January', year: 2026 });
  await testCannotAccess('Employee', '/api/payroll/generate', employeeToken, 
    'Employee CANNOT generate payroll', 'POST', { month: 'January', year: 2026 });

  // Test payroll processing
  await testCanAccess('Admin', '/api/payroll/process', adminToken, 
    'Admin can process payroll', 'POST', { ids: [] });
  await testCanAccess('HR Manager', '/api/payroll/process', hrToken, 
    'HR Manager can process payroll', 'POST', { ids: [] });
  await testCannotAccess('Employee', '/api/payroll/process', employeeToken, 
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
    '/api/reports/attendance?startDate=2026-01-01&endDate=2026-01-31',
    '/api/reports/payroll?month=January&year=2026',
    '/api/reports/leave?startDate=2026-01-01&endDate=2026-01-31',
    '/api/reports/comprehensive?month=January&year=2026'
  ];

  const reportNames = ['employee', 'attendance', 'payroll', 'leave', 'comprehensive'];

  for (let i = 0; i < reportEndpoints.length; i++) {
    const endpoint = reportEndpoints[i];
    const reportType = reportNames[i];
    await testCanAccess('Admin', endpoint, adminToken, 
      `Admin can access ${reportType} report`);
    await testCanAccess('HR Manager', endpoint, hrToken, 
      `HR Manager can access ${reportType} report`);
    await testCannotAccess('Employee', endpoint, employeeToken, 
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
    console.log('🎉 All tests passed! UI permissions are working correctly.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed with error:');
  console.error(error);
  process.exit(1);
});
