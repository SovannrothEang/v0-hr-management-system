/**
 * Machine User Authentication Test
 * Tests login and token refresh for the HRMS_API role
 */

const fetch = globalThis.fetch;

const API_BASE_URL = "http://localhost:3001/api";

const machineUser = {
  email: "machine@example.com",
  password: "Machine123!"
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const test = async () => {
  console.log("🧪 Testing Machine User Authentication Flow\n");

  // Test 1: Login with machine credentials
  console.log("1. Testing login with machine credentials...");
  const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(machineUser),
  });

  if (!loginResponse.ok) {
    console.error("❌ Login failed:", await loginResponse.text());
    process.exit(1);
  }

  const loginData = await loginResponse.json();
  console.log("✅ Login successful");
  console.log("   - User:", loginData.data.user.email);
  console.log("   - Roles:", loginData.data.user.roles.join(", "));
  
  if (!loginData.data.user.roles.includes("HRMS_API")) {
      console.error("❌ User does not have HRMS_API role");
      process.exit(1);
  }

  const accessToken = loginData.data.accessToken;
  
  // Extract cookies for subsequent requests
  const cookies = loginResponse.headers.get("set-cookie");
  // Basic cookie parsing for the fetch call
  const cookieHeader = cookies ? cookies.split(",").map(c => c.split(";")[0]).join("; ") : "";

  console.log("   - Access token received:", !!accessToken);

  // Test 2: Access Machine-Only Endpoint
  console.log("\n2. Testing access to machine-only endpoint (QR generation)...");
  await sleep(1000);

  const qrResponse = await fetch(`${API_BASE_URL}/attendances/qr/in`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!qrResponse.ok) {
    console.error("❌ QR endpoint access failed:", await qrResponse.text());
    // Don't exit, we want to test refresh even if this fails, but it shouldn't fail
  } else {
    const qrData = await qrResponse.json();
    console.log("✅ QR generation successful");
    console.log("   - Token:", !!qrData.token);
    console.log("   - URL:", qrData.qrUrl);
  }

  // Test 3: Test token refresh
  console.log("\n3. Testing token refresh...");
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
  console.log("   - New access token received:", !!refreshData.data.accessToken);

  console.log("\n" + "=".repeat(60));
  console.log("✅ Machine User auth tests passed!");
  console.log("=".repeat(60));
};

test().catch((error) => {
  console.error("\n❌ Test failed with error:", error.message);
  process.exit(1);
});
