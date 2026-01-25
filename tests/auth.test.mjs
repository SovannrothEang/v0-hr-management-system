#!/usr/bin/env node
/**
 * Authentication & Authorization Test Script
 * Tests all 3 roles against protected API routes
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
    return data.data.token;
  } catch (error) {
    throw new Error(`Login error: ${error.message}`);
  }
}

async function testRoute(route, token, expectSuccess) {
  try {
    const options = {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    if (route.body) {
      options.body = JSON.stringify(route.body);
    }

    const response = await fetch(`${BASE_URL}${route.path}`, options);
    const status = response.status;

    if (expectSuccess && status === 200) {
      return { success: true, status, message: 'Access granted ✓' };
    } else if (!expectSuccess && (status === 403 || status === 401)) {
      return { success: true, status, message: 'Access denied (as expected) ✓' };
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
  let token;
  try {
    token = await login(user);
    log('green', `   ✓ Login successful - Token received`);
  } catch (error) {
    log('red', `   ✗ Login failed: ${error.message}`);
    return;
  }

  // Test Admin & HR Manager routes
  log('blue', '\n2. Testing Admin & HR Manager routes...');
  const shouldAccessAdminHr = userType === 'admin' || userType === 'hrManager';
  for (const route of TEST_ROUTES.adminHrOnly) {
    const result = await testRoute(route, token, shouldAccessAdminHr);
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    log(color, `   ${icon} ${route.name}: ${result.message} (${result.status})`);
  }

  // Test Admin only routes
  log('blue', '\n3. Testing Admin-only routes...');
  const shouldAccessAdmin = userType === 'admin';
  for (const route of TEST_ROUTES.adminOnly) {
    const result = await testRoute(route, token, shouldAccessAdmin);
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    log(color, `   ${icon} ${route.name}: ${result.message} (${result.status})`);
  }

  // Test all authenticated routes
  log('blue', '\n4. Testing routes for all authenticated users...');
  for (const route of TEST_ROUTES.allAuth) {
    const result = await testRoute(route, token, true);
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    log(color, `   ${icon} ${route.name}: ${result.message} (${result.status})`);
  }
}

async function testWithoutAuth() {
  log('cyan', `\n${'='.repeat(60)}`);
  log('cyan', 'Testing: Unauthenticated Access');
  log('cyan', '='.repeat(60));

  log('blue', '\nTesting protected route without token...');
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

async function runTests() {
  log('yellow', '\n╔═══════════════════════════════════════════════════════════╗');
  log('yellow', '║  HR Management System - Authentication & RBAC Tests      ║');
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
  log('blue', '  • Admin: Access to all routes');
  log('blue', '  • HR Manager: Access to admin/hr routes (not admin-only)');
  log('blue', '  • Employee: Access to basic routes only');
  log('blue', '  • No token: All requests denied (401)');
  log('yellow', '\n');
}

runTests().catch(error => {
  log('red', `\nFatal error: ${error.message}`);
  process.exit(1);
});
