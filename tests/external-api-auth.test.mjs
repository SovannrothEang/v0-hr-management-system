/**
 * External API Authentication Test
 * Tests the complete authentication flow with the external API
 */

// Use native fetch (available in Node.js 18+)
const fetch = globalThis.fetch;

const API_BASE_URL = "http://localhost:3001/api";
const FRONTEND_URL = "http://localhost:3000";

const testUsers = {
  admin: { email: "admin@example.com", password: "Admin123!" },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const test = async () => {
  console.log("🧪 Testing External API Authentication Flow\n");

  // Test 1: Login with admin credentials
  console.log("1. Testing login with admin credentials...");
  const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUsers.admin),
  });

  if (!loginResponse.ok) {
    console.error("❌ Login failed:", await loginResponse.text());
    process.exit(1);
  }

  const loginData = await loginResponse.json();
  console.log("✅ Login successful");
  console.log("   - User:", loginData.data.user.email);
  console.log("   - Roles:", loginData.data.user.roles.join(", "));
  console.log("   - Access token received:", loginData.data.accessToken ? "Yes" : "No");
  console.log("   - Expires at:", new Date(loginData.data.expiresAt).toISOString());

  const accessToken = loginData.data.accessToken;
  const csrfToken = loginResponse.headers.get("set-cookie")?.match(/csrf_token=([^;]+)/)?.[1];
  
  // Extract cookies for subsequent requests
  const cookies = loginResponse.headers.get("set-cookie");
  const cookieHeader = cookies ? cookies.split(",").map(c => c.split(";")[0]).join("; ") : "";

  // Test 2: Validate session with access token
  console.log("\n2. Testing session validation...");
  await sleep(1000);

  const sessionResponse = await fetch(`${API_BASE_URL}/auth/session`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!sessionResponse.ok) {
    console.error("❌ Session validation failed:", await sessionResponse.text());
    process.exit(1);
  }

  const sessionData = await sessionResponse.json();
  console.log("✅ Session validation successful");
  console.log("   - User:", sessionData.data.email);
  console.log("   - Roles:", sessionData.data.roles.join(", "));

  // Test 3: Test employees endpoint
  console.log("\n3. Testing employees endpoint...");
  await sleep(1000);

  const employeesResponse = await fetch(`${API_BASE_URL}/employees?page=1&limit=10`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!employeesResponse.ok) {
    console.error("❌ Employees endpoint failed:", await employeesResponse.text());
    process.exit(1);
  }

  const employeesData = await employeesResponse.json();
  console.log("✅ Employees endpoint successful");
  console.log("   - Total employees:", employeesData.meta?.total || 0);
  console.log("   - Page:", employeesData.meta?.page || 1);
  console.log("   - Employees returned:", employeesData.data?.length || 0);

  // Test 4: Test logout
  console.log("\n4. Testing logout...");
  await sleep(1000);

  const logoutResponse = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      ...(csrfToken && { "x-csrf-token": csrfToken }),
    },
  });

  if (!logoutResponse.ok) {
    console.error("❌ Logout failed:", await logoutResponse.text());
    process.exit(1);
  }

  console.log("✅ Logout successful");

  // Test 5: Verify session is still valid after logout (JWT is stateless)
  console.log("\n5. Testing session validation after logout...");
  await sleep(1000);

  const invalidSessionResponse = await fetch(`${API_BASE_URL}/auth/session`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!invalidSessionResponse.ok) {
    console.error("❌ Session should still be valid (JWT is stateless)");
    process.exit(1);
  }

  console.log("✅ Session still valid after logout (JWT is stateless)");
  console.log("   - Note: JWT tokens expire after 1 hour, not invalidated on logout");

  // Test 6: Test token refresh
  console.log("\n6. Testing token refresh...");
  await sleep(1000);

  const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
    },
  });

  if (!refreshResponse.ok) {
    console.error("❌ Token refresh failed:", await refreshResponse.text());
    process.exit(1);
  }

  const refreshData = await refreshResponse.json();
  console.log("✅ Token refresh successful");
  console.log("   - New access token received:", refreshData.data.accessToken ? "Yes" : "No");
  console.log("   - New expires at:", new Date(refreshData.data.expiresAt).toISOString());

  console.log("\n" + "=".repeat(60));
  console.log("✅ All external API authentication tests passed!");
  console.log("=".repeat(60));
};

test().catch((error) => {
  console.error("\n❌ Test failed with error:", error.message);
  process.exit(1);
});
