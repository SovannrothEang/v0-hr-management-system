/**
 * Pagination Integration Tests
 * Tests pagination functionality with the external API
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const TEST_USER = { email: 'admin@hrflow.com', password: 'admin123' };

let authToken = null;

console.log('🧪 Running Pagination Integration Tests...\n');

/**
 * Helper function to make authenticated API requests
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Test 1: Login and get auth token
 */
async function testLogin() {
  console.log('Test 1: Login and get auth token');
  console.log('-----------------------------------');
  
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_USER),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.log('❌ FAILED: Login failed');
    console.log('   Error:', data.message || response.statusText);
    return false;
  }

  if (!data.data?.accessToken) {
    console.log('❌ FAILED: No access token in response');
    return false;
  }

  authToken = data.data.accessToken;
  console.log('✅ PASSED: Login successful');
  console.log(`   User: ${data.data.user.email}`);
  console.log(`   Role: ${data.data.user.role}\n`);
  return true;
}

/**
 * Test 2: Get employees with pagination
 */
async function testEmployeesPagination() {
  console.log('Test 2: Get employees with pagination');
  console.log('--------------------------------------');
  
  // Test with page=1, limit=5
  const response = await apiRequest('/employees?page=1&limit=5');
  const data = await response.json();

  if (!response.ok) {
    console.log('❌ FAILED: Could not fetch employees');
    console.log('   Error:', data.message || response.statusText);
    return false;
  }

  if (!data.data || !Array.isArray(data.data)) {
    console.log('❌ FAILED: Response does not contain data array');
    return false;
  }

  if (!data.meta) {
    console.log('❌ FAILED: Response does not contain meta object');
    return false;
  }

  console.log('✅ PASSED: Employees pagination response is valid');
  console.log(`   Page: ${data.meta.page}`);
  console.log(`   Limit: ${data.meta.limit}`);
  console.log(`   Total: ${data.meta.total}`);
  console.log(`   Total Pages: ${data.meta.totalPages}`);
  console.log(`   Has Next: ${data.meta.hasNext}`);
  console.log(`   Has Previous: ${data.meta.hasPrevious}`);
  console.log(`   Records returned: ${data.data.length}\n`);

  // Verify pagination logic
  if (data.meta.page !== 1) {
    console.log('❌ FAILED: Page should be 1');
    return false;
  }

  if (data.meta.limit !== 5) {
    console.log('❌ FAILED: Limit should be 5');
    return false;
  }

  if (data.data.length > 5) {
    console.log('❌ FAILED: Should not return more than 5 records');
    return false;
  }

  console.log('✅ PASSED: Pagination logic is correct\n');
  return true;
}

/**
 * Test 3: Get attendance with pagination
 */
async function testAttendancePagination() {
  console.log('Test 3: Get attendance with pagination');
  console.log('---------------------------------------');
  
  const response = await apiRequest('/attendance?page=1&limit=10');
  const data = await response.json();

  if (!response.ok) {
    console.log('❌ FAILED: Could not fetch attendance');
    console.log('   Error:', data.message || response.statusText);
    return false;
  }

  if (!data.data || !Array.isArray(data.data)) {
    console.log('❌ FAILED: Response does not contain data array');
    return false;
  }

  if (!data.meta) {
    console.log('❌ FAILED: Response does not contain meta object');
    return false;
  }

  console.log('✅ PASSED: Attendance pagination response is valid');
  console.log(`   Page: ${data.meta.page}`);
  console.log(`   Limit: ${data.meta.limit}`);
  console.log(`   Total: ${data.meta.total}`);
  console.log(`   Total Pages: ${data.meta.totalPages}`);
  console.log(`   Records returned: ${data.data.length}\n`);

  return true;
}

/**
 * Test 4: Get departments with pagination
 */
async function testDepartmentsPagination() {
  console.log('Test 4: Get departments with pagination');
  console.log('----------------------------------------');
  
  const response = await apiRequest('/departments?page=1&limit=10');
  const data = await response.json();

  if (!response.ok) {
    console.log('❌ FAILED: Could not fetch departments');
    console.log('   Error:', data.message || response.statusText);
    return false;
  }

  if (!data.data || !Array.isArray(data.data)) {
    console.log('❌ FAILED: Response does not contain data array');
    return false;
  }

  if (!data.meta) {
    console.log('❌ FAILED: Response does not contain meta object');
    return false;
  }

  console.log('✅ PASSED: Departments pagination response is valid');
  console.log(`   Page: ${data.meta.page}`);
  console.log(`   Limit: ${data.meta.limit}`);
  console.log(`   Total: ${data.meta.total}`);
  console.log(`   Total Pages: ${data.meta.totalPages}`);
  console.log(`   Records returned: ${data.data.length}\n`);

  return true;
}

/**
 * Test 5: Get leave requests with pagination
 */
async function testLeaveRequestsPagination() {
  console.log('Test 5: Get leave requests with pagination');
  console.log('-------------------------------------------');
  
  const response = await apiRequest('/leave-requests?page=1&limit=10');
  const data = await response.json();

  if (!response.ok) {
    console.log('❌ FAILED: Could not fetch leave requests');
    console.log('   Error:', data.message || response.statusText);
    return false;
  }

  if (!data.data || !Array.isArray(data.data)) {
    console.log('❌ FAILED: Response does not contain data array');
    return false;
  }

  if (!data.meta) {
    console.log('❌ FAILED: Response does not contain meta object');
    return false;
  }

  console.log('✅ PASSED: Leave requests pagination response is valid');
  console.log(`   Page: ${data.meta.page}`);
  console.log(`   Limit: ${data.meta.limit}`);
  console.log(`   Total: ${data.meta.total}`);
  console.log(`   Total Pages: ${data.meta.totalPages}`);
  console.log(`   Records returned: ${data.data.length}\n`);

  return true;
}

/**
 * Test 6: Test pagination navigation (page 2)
 */
async function testPaginationNavigation() {
  console.log('Test 6: Test pagination navigation (page 2)');
  console.log('--------------------------------------------');
  
  const response = await apiRequest('/employees?page=2&limit=5');
  const data = await response.json();

  if (!response.ok) {
    console.log('❌ FAILED: Could not fetch page 2');
    console.log('   Error:', data.message || response.statusText);
    return false;
  }

  if (data.meta.page !== 2) {
    console.log('❌ FAILED: Page should be 2');
    return false;
  }

  console.log('✅ PASSED: Page navigation works correctly');
  console.log(`   Current Page: ${data.meta.page}`);
  console.log(`   Has Previous: ${data.meta.hasPrevious}`);
  console.log(`   Has Next: ${data.meta.hasNext}\n`);

  return true;
}

/**
 * Test 7: Test filtering with pagination
 */
async function testFilteringWithPagination() {
  console.log('Test 7: Test filtering with pagination');
  console.log('---------------------------------------');
  
  const response = await apiRequest('/employees?page=1&limit=5&status=active');
  const data = await response.json();

  if (!response.ok) {
    console.log('❌ FAILED: Could not fetch filtered employees');
    console.log('   Error:', data.message || response.statusText);
    return false;
  }

  console.log('✅ PASSED: Filtering with pagination works');
  console.log(`   Filter: status=active`);
  console.log(`   Page: ${data.meta.page}`);
  console.log(`   Total: ${data.meta.total}`);
  console.log(`   Records returned: ${data.data.length}\n`);

  return true;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('PAGINATION INTEGRATION TEST SUITE');
  console.log('='.repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  const tests = [
    testLogin,
    testEmployeesPagination,
    testAttendancePagination,
    testDepartmentsPagination,
    testLeaveRequestsPagination,
    testPaginationNavigation,
    testFilteringWithPagination,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
      failed++;
    }
  }

  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 All pagination tests passed!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
