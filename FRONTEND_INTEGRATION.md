# HRMS API - Frontend Integration Guide

This document outlines all API endpoints and features ready for frontend integration from Phase 2 implementation.

## API Configuration

The API is implemented as Next.js API routes running on the same server as the frontend. The base URL is configured via environment variables.

### Environment Configuration

Create a `.env.development` file in your project root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

**Available Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - The base URL for all API requests (defaults to `/api` if not set)
- `JWT_SECRET` - Server-side JWT secret for token verification
- `JWT_REFRESH_SECRET` - Server-side refresh token secret

### Environment-Specific Configuration

| Environment | File | Default API URL |
|-------------|------|-----------------|
| Development | `.env.development` | `http://localhost:3000/api` |
| Staging | `.env.staging` | `https://staging.hrflow.com/api` |
| Production | `.env.production` | `https://hrflow.com/api` |

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser. For production deployments, the API runs on the same domain as the frontend.

---

**Base URL:** `/api` (relative to frontend URL)  
**Full URL (Development):** `http://localhost:3000/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Employee Module](#employee-module)
3. [Attendance Module](#attendance-module)
4. [Audit Logs Module](#audit-logs-module)
5. [Payroll Module](#payroll-module)
6. [Reports Module](#reports-module)
7. [Rate Limiting](#rate-limiting)
8. [TypeScript Interfaces](#typescript-interfaces)

---

## Authentication

All protected endpoints use cookie-based authentication with CSRF protection.

### Authentication Flow

1. **Login:** POST to `/api/auth/login` with credentials
   - Server sets httpOnly cookies: `auth_token`, `refresh_token`, `csrf_token`
   - Client stores user info and CSRF token in session store

2. **Session Validation:** GET to `/api/auth/session`
   - Validates session with server on app load
   - Returns user data and session expiry

3. **Token Refresh:** POST to `/api/auth/refresh`
   - Automatically called when access token expires
   - Implements token rotation for security

4. **Logout:** POST to `/api/auth/logout`
   - Clears all authentication cookies
   - Clears client session state

### CSRF Protection

All state-changing requests (POST, PUT, PATCH, DELETE) require the `X-CSRF-Token` header:

```http
X-CSRF-Token: <csrf_token_from_cookie>
```

The CSRF token is automatically handled by the `apiClient` utility.

### API Client Usage

Use the centralized `apiClient` for all API requests:

```typescript
import { apiClient } from "@/lib/api-client";

// GET request
const { data } = await apiClient.get<ResponseType>("/api/endpoint");

// POST request (CSRF token automatically added)
const { data } = await apiClient.post<ResponseType>("/api/endpoint", body);
```

---

## Employee Module

### Employee Fields

The Employee model includes comprehensive HR management fields.

### Endpoints

#### Get All Employees
```http
GET /api/employees
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name, email, or employee ID |
| `department` | string | Filter by department name |
| `status` | string | Filter by employee status |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "EMP001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "avatar": "https://example.com/image.jpg",
      "department": "Engineering",
      "position": "Software Engineer",
      "employmentType": "full_time",
      "status": "active",
      "hireDate": "2023-01-01",
      "salary": 50000.00,
      "managerId": "uuid-manager",
      "address": "123 Main St",
      "emergencyContact": {
        "name": "Jane Doe",
        "phone": "+1234567890",
        "relationship": "Spouse"
      },
      "bankDetails": {
        "bankName": "Chase Bank",
        "accountNumber": "1234567890",
        "accountName": "John Doe"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-15T00:00:00.000Z"
    }
  ]
}
```

#### Get Single Employee
```http
GET /api/employees/:id
```

#### Create Employee
```http
POST /api/employees
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "department": "Engineering",
  "position": "Software Engineer",
  "employmentType": "full_time",
  "status": "active",
  "hireDate": "2023-01-01",
  "salary": 50000.00,
  "managerId": "uuid-manager",
  "address": "123 Main St",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567890",
    "relationship": "Spouse"
  },
  "bankDetails": {
    "bankName": "Chase Bank",
    "accountNumber": "1234567890",
    "accountName": "John Doe"
  },
  "username": "johndoe",
  "email": "john@example.com",
  "roleName": "employee"
}
```

#### Update Employee
```http
PUT /api/employees/:id
```

**Request Body:** (all fields optional)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "employmentType": "part_time",
  "status": "on_leave",
  "salary": 55000.00,
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567890",
    "relationship": "Spouse"
  },
  "bankDetails": {
    "bankName": "Bank of America",
    "accountNumber": "0987654321",
    "accountName": "John Doe"
  }
}
```

### Enums

#### Employment Type
| Value | Description |
|-------|-------------|
| `full_time` | Full-time employee |
| `part_time` | Part-time employee |
| `contract` | Contract worker |
| `intern` | Intern |

#### Employee Status
| Value | Description |
|-------|-------------|
| `active` | Currently active |
| `inactive` | Inactive employee |
| `on_leave` | On leave |
| `probation` | Probation period |
| `terminated` | Employment terminated |

---

## Attendance Module

### Attendance Tracking

The Attendance module includes work hours calculation, overtime tracking, and notes.

### Endpoints

#### Get Attendances
```http
GET /api/attendance
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by employee name or ID |
| `date` | string | Filter by date (YYYY-MM-DD) |
| `status` | string | Filter by attendance status |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "date": "2026-01-27",
      "clockIn": "2026-01-27T08:00:00.000Z",
      "clockOut": "2026-01-27T17:30:00.000Z",
      "status": "present",
      "workHours": 9.5,
      "overtime": 1.5,
      "notes": "Completed project milestone"
    }
  ]
}
```

#### Clock In
```http
POST /api/attendance/clock-in
```

**Request Body:**
```json
{
  "employeeId": "uuid-employee"
}
```

#### Clock Out
```http
POST /api/attendance/clock-out
```

**Request Body:**
```json
{
  "employeeId": "uuid-employee",
  "notes": "Worked on project X"
}
```

**Auto-calculated fields on clock-out:**
- `workHours`: Total hours worked (clockOut - clockIn)
- `overtime`: Hours beyond standard 8-hour day (workHours - 8, minimum 0)

---

## Audit Logs Module

### Enhanced Audit Logging

Audit logs include IP address, user agent, severity level, and success status.

### Endpoints

#### Get Audit Logs
```http
GET /api/audit-logs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page (default: 100) |
| `offset` | number | Offset for pagination (default: 0) |
| `userId` | string | Filter by user ID |
| `action` | string | Filter by action (CREATE, UPDATE, DELETE) |
| `severity` | string | Filter by severity level |
| `startDate` | Date | Filter from date |
| `endDate` | Date | Filter to date |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit-1234567890",
      "timestamp": "2026-01-27T10:30:00.000Z",
      "action": "UPDATE",
      "severity": "INFO",
      "userId": "user-uuid-123",
      "userEmail": "john.doe@company.com",
      "userRole": "admin",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "resource": "employees",
      "resourceId": "record-uuid-123",
      "details": { "status": "ACTIVE", "newStatus": "ON_LEAVE" },
      "success": true
    }
  ]
}
```

### Enums

#### Attendance Status
| Value | Description |
|-------|-------------|
| `present` | Employee was present |
| `late` | Employee was late |
| `absent` | Employee was absent |
| `half_day` | Half day attendance |
| `on_leave` | Employee on leave |

#### Audit Severity
| Value | Description | Use Case |
|-------|-------------|----------|
| `INFO` | Informational | Normal operations |
| `WARNING` | Warning | Potential issues |
| `ERROR` | Error | Operation failed |
| `CRITICAL` | Critical | System-level issues |

---

## Payroll Module

### Payroll Endpoints

#### Get Payroll Summary
```http
GET /api/payroll/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPayroll": 100,
    "totalEmployees": 150,
    "totalOvertimePaid": 5000.00,
    "totalBonuses": 2000.00,
    "totalDeductions": 50000.00,
    "averageSalary": 3333.33
  }
}
```

#### Get Payroll List
```http
GET /api/payroll
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by employee name or ID |
| `department` | string | Filter by department name |
| `status` | string | Filter by payroll status |
| `month` | string | Filter by month (e.g., "January") |
| `year` | number | Filter by year |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "EMP001",
      "employee": {
        "id": "uuid",
        "employeeId": "EMP001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "department": "Engineering"
      },
      "period": "January 2026",
      "month": "January",
      "year": 2026,
      "basicSalary": 5000.00,
      "allowances": 500.00,
      "deductions": 700.00,
      "netPay": 4800.00,
      "status": "processed",
      "processedAt": "2026-01-31T00:00:00.000Z"
    }
  ]
}
```

#### Generate Bulk Payroll
```http
POST /api/payroll/generate
```

**Request Body:**
```json
{
  "payPeriodStart": "2026-01-01",
  "payPeriodEnd": "2026-01-31",
  "currencyCode": "USD",
  "departmentId": "uuid-department-id",
  "employeeIds": ["uuid-employee-1", "uuid-employee-2"]
}
```

**Note:** 
- If `employeeIds` is provided, only those employees will have payroll generated
- If `departmentId` is provided (without `employeeIds`), all active employees in that department
- If neither is provided, all active employees in the system

**Response:**
```json
{
  "success": true,
  "data": {
    "totalGenerated": 10,
    "totalSkipped": 2,
    "totalFailed": 0,
    "generatedPayrollIds": [
      "uuid-payroll-1",
      "uuid-payroll-2"
    ],
    "skippedEmployees": [
      {
        "employeeId": "uuid-1",
        "employeeName": "John Doe",
        "reason": "Payroll already exists for this period"
      }
    ],
    "failedEmployees": []
  }
}
```

#### Mark Payroll as Paid
```http
POST /api/payroll/mark-paid
```

**Request Body:**
```json
{
  "ids": ["uuid-payroll-1", "uuid-payroll-2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payrolls marked as paid"
}
```

---

## Reports Module

### Report Endpoints

All report endpoints require `ADMIN` or `HR_MANAGER` role.

#### Employee Report
```http
GET /api/reports/employee
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `departmentId` | string (UUID) | Filter by department |
| `status` | string | Filter by employee status |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeCode": "EMP001",
      "fullName": "John Doe",
      "email": "john@example.com",
      "department": "Engineering",
      "position": "Software Engineer",
      "status": "active",
      "employmentType": "full_time",
      "hireDate": "2023-01-01T00:00:00.000Z",
      "salary": 50000.00
    }
  ]
}
```

#### Export Employee Report
```http
GET /api/reports/employee/export
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | Yes | `xlsx` or `csv` |
| `departmentId` | string (UUID) | No | Filter by department |
| `status` | string | No | Filter by employee status |

**Response:** File download (Excel or CSV)

#### Payroll Report
```http
GET /api/reports/payroll
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | number | Filter by year |
| `month` | number | Filter by month (1-12) |
| `departmentId` | string (UUID) | Filter by department |
| `status` | string | Filter by payroll status |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeCode": "EMP001",
      "employeeName": "John Doe",
      "department": "Engineering",
      "payPeriodStart": "2026-01-01T00:00:00.000Z",
      "payPeriodEnd": "2026-01-31T00:00:00.000Z",
      "basicSalary": 5000.00,
      "overtimePay": 500.00,
      "bonus": 200.00,
      "deductions": 700.00,
      "netSalary": 5000.00,
      "status": "processed"
    }
  ]
}
```

#### Export Payroll Report
```http
GET /api/reports/payroll/export
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | Yes | `xlsx` or `csv` |
| `year` | number | No | Filter by year |
| `month` | number | No | Filter by month |
| `departmentId` | string (UUID) | No | Filter by department |
| `status` | string | No | Filter by payroll status |

**Response:** File download (Excel or CSV)

#### Comprehensive Report (Dashboard Data)
```http
GET /api/reports/comprehensive
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | number | Filter by year (default: current year) |
| `month` | number | Filter by month (default: current month) |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEmployees": 150,
    "activeEmployees": 142,
    "departmentBreakdown": [
      { "department": "Engineering", "count": 50 },
      { "department": "Sales", "count": 30 },
      { "department": "HR", "count": 10 }
    ],
    "payrollSummary": {
      "totalPayrolls": 142,
      "totalNetSalary": 710000.00,
      "pendingPayrolls": 5,
      "processedPayrolls": 137
    },
    "attendanceSummary": {
      "totalPresent": 2800,
      "totalLate": 150,
      "totalAbsent": 50,
      "averageWorkHours": 8.2
    },
    "leaveRequests": {
      "pending": 12,
      "approved": 45,
      "rejected": 3
    }
  }
}
```

---

## Rate Limiting

All API responses include rate limit headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when the limit resets |
| `Retry-After` | Seconds to wait after rate limit (429 response) |

**Rate Limit Presets:**
- **Auth endpoints:** 5 requests per minute
- **Token refresh:** 10 requests per minute
- **Write operations:** 30 requests per minute
- **Read operations:** 100 requests per minute
- **General API:** 200 requests per minute

**Example:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706364000
```

---

## TypeScript Interfaces

### Employee Types

```typescript
// Employment Type Enum
type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';

// Employee Status Enum
type EmploymentStatus = 'active' | 'on_leave' | 'terminated' | 'probation' | 'inactive';

// Emergency Contact
interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Bank Details
interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// Employee DTO
interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  department: string;
  position: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  hireDate: string;
  salary: number;
  managerId?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  bankDetails?: BankDetails;
  createdAt: string;
  updatedAt: string;
}

// Create Employee DTO
interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  employmentType?: EmploymentType;
  status?: EmploymentStatus;
  hireDate: string;
  salary?: number;
  managerId?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  bankDetails?: BankDetails;
  username: string;
  email: string;
  roleName: 'employee' | 'hr_manager';
}
```

### Attendance Types

```typescript
// Attendance Status Enum
type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: AttendanceStatus;
  workHours?: number;
  overtime?: number;
  notes?: string;
}

interface ClockInDto {
  employeeId: string;
}

interface ClockOutDto {
  employeeId: string;
  notes?: string;
}
```

### Audit Log Types

```typescript
// Audit Action Enum
type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'LOGIN_FAILED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_UPDATED'
  | 'EMPLOYEE_DELETED'
  | 'EMPLOYEE_VIEWED'
  | 'PAYROLL_GENERATED'
  | 'PAYROLL_PROCESSED'
  | 'PAYROLL_MARKED_PAID'
  | 'PAYROLL_VIEWED'
  | 'LEAVE_REQUEST_CREATED'
  | 'LEAVE_REQUEST_APPROVED'
  | 'LEAVE_REQUEST_REJECTED'
  | 'REPORT_GENERATED'
  | 'REPORT_EXPORTED'
  | 'ACCESS_DENIED'
  | 'PERMISSION_VIOLATION';

// Audit Severity Enum
type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  severity: AuditSeverity;
  userId: string;
  userEmail: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}
```

### Payroll Types

```typescript
// Payroll Status Enum
type PayrollStatus = 'pending' | 'processed' | 'paid';

interface PayrollSummary {
  totalPayroll: number;
  totalEmployees: number;
  totalOvertimePaid: number;
  totalBonuses: number;
  totalDeductions: number;
  averageSalary: number;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  employee?: Employee;
  period: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  processedAt?: string;
  paidAt?: string;
}

interface GeneratePayrollDto {
  payPeriodStart: string;
  payPeriodEnd: string;
  currencyCode: string;
  departmentId?: string;
  employeeIds?: string[];
}

interface GeneratePayrollResult {
  totalGenerated: number;
  totalSkipped: number;
  totalFailed: number;
  generatedPayrollIds: string[];
  skippedEmployees: {
    employeeId: string;
    employeeName: string;
    reason: string;
  }[];
  failedEmployees: {
    employeeId: string;
    employeeName: string;
    error: string;
  }[];
}

interface MarkPaidDto {
  ids: string[];
}
```

### Report Types

```typescript
interface EmployeeReportData {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  status: string;
  employmentType: string;
  hireDate: string;
  salary: number | null;
}

interface PayrollReportData {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  basicSalary: number;
  overtimePay: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: string;
}

interface ComprehensiveReportData {
  totalEmployees: number;
  activeEmployees: number;
  departmentBreakdown: { department: string; count: number }[];
  payrollSummary: {
    totalPayrolls: number;
    totalNetSalary: number;
    pendingPayrolls: number;
    processedPayrolls: number;
  };
  attendanceSummary: {
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    averageWorkHours: number;
  };
  leaveRequests: {
    pending: number;
    approved: number;
    rejected: number;
  };
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description"
}
```

For authentication/permission errors:

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "required": ["admin", "hr_manager"],
  "current": ["employee"]
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Frontend Implementation Checklist

### Authentication
- [ ] Login form with email/password
- [ ] Session validation on app load
- [ ] Automatic token refresh
- [ ] Logout functionality
- [ ] Session timeout warning component

### Employee Management
- [ ] Employee list with search and filters
- [ ] Employee detail view
- [ ] Create employee form with emergency contact and bank details
- [ ] Edit employee form with all updatable fields
- [ ] Employee status badge component
- [ ] Employment type selector

### Attendance
- [ ] Attendance list with work hours display
- [ ] Clock-in/clock-out functionality
- [ ] Overtime hours display
- [ ] Work hours summary component
- [ ] Date and status filters

### Audit Logs
- [ ] Audit log viewer with severity filters
- [ ] IP address and user agent display
- [ ] Success/failure status indicator
- [ ] Severity badge component (INFO, WARNING, ERROR, CRITICAL)
- [ ] Date range filters

### Payroll
- [ ] Payroll summary dashboard
- [ ] Payroll list with filters
- [ ] Bulk payroll generation form
- [ ] Mark payroll as paid functionality
- [ ] Department and status filters

### Reports
- [ ] Employee report page with filters
- [ ] Payroll report page with filters
- [ ] Comprehensive dashboard with all metrics
- [ ] Leave request reports

### Permissions
- [ ] Role-based UI protection
- [ ] Permission checks for sensitive actions
- [ ] Admin-only features
- [ ] HR Manager vs Employee view differences

---

*Last updated: January 30, 2026*
