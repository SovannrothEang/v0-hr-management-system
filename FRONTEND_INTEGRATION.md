# HRMS API - Frontend Integration Guide

This document outlines all API endpoints and features ready for frontend integration from Phase 2 implementation.

## API Configuration

The API is an external NestJS API running on a separate server. The base URL is configured via environment variables.

### Environment Configuration

Create a `.env.development` file in your project root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

**Available Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - The base URL for all API requests (defaults to `/api` if not set)
- `NEXT_PUBLIC_API_SWAGGER_URL` - URL for API documentation (optional)

### Environment-Specific Configuration

| Environment | File | Default API URL |
|-------------|------|-----------------|
| Development | `.env.development` | `http://localhost:3001/api` |
| Staging | `.env.staging` | `https://staging-api.hrflow.com/api` |
| Production | `.env.production` | `https://api.hrflow.com/api` |

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

---

**Base URL:** `http://localhost:3001/api` (Development)  
**Swagger Documentation:** `http://localhost:3001/api/swagger`

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

All protected endpoints use Bearer token authentication with CSRF protection.

### Authentication Flow

1. **Login:** POST to `/api/auth/login` with credentials
   - Server returns access token and user data in response body
   - Server also sets httpOnly cookies (access_token, refresh_token, csrf_token, session_id)
   - Client stores access token and CSRF token in memory (Zustand store)
   - **No localStorage usage** - tokens stored in React state only

2. **Session Validation:** GET to `/api/auth/session`
   - Validates session with server on app load
   - Requires Bearer token in Authorization header
   - Returns user data and session expiry

3. **Token Refresh:** POST to `/api/auth/refresh`
   - Automatically called when access token expires
   - Uses refresh token from httpOnly cookies
   - Returns new access token in response body
   - Client updates access token in memory

4. **Logout:** POST to `/api/auth/logout`
   - Clears server-side cookies
   - Clears client session state (access token in memory)

### API Client Usage

Use the centralized `apiClient` for all API requests:

```typescript
import { apiClient } from "@/lib/api-client";

// GET request
const { data } = await apiClient.get<ResponseType>("/api/endpoint");

// POST request (Bearer token and CSRF token automatically added)
const { data } = await apiClient.post<ResponseType>("/api/endpoint", body);
```

**Note:** The `apiClient` automatically adds:
- Bearer token in Authorization header
- CSRF token in x-csrf-token header for state-changing requests

---

## Employee Module

### Enhanced Employee Fields

The Employee model now includes additional fields for better HR management.

### Endpoints

#### Get All Employees
```http
GET /api/employees
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `search` | string | Search by name or employee code |
| `departmentId` | string (UUID) | Filter by department |
| `status` | string | Filter by employee status |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "employeeCode": "EMP001",
      "firstname": "John",
      "lastname": "Doe",
      "gender": "male",
      "dateOfBirth": "1990-01-01",
      "userId": "uuid",
      "user": { ... },
      "address": "123 Main St",
      "phoneNumber": "+1234567890",
      "profileImage": "https://example.com/image.jpg",
      "hireDate": "2023-01-01T00:00:00.000Z",
      "positionId": "uuid",
      "position": { ... },
      "departmentId": "uuid",
      "department": { ... },
      "employmentType": "FULL_TIME",
      "status": "ACTIVE",
      "salary": 50000.00,
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
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-15T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
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
  "firstname": "John",
  "lastname": "Doe",
  "employeeCode": "EMP001",
  "gender": 0,
  "dob": "1990-01-01",
  "address": "123 Main St",
  "phone": "+1234567890",
  "profileImage": "https://example.com/image.jpg",
  "hireDate": "2023-01-01",
  "departmentId": "uuid-dept",
  "positionId": "uuid-pos",
  "managerId": "uuid-manager",
  "employmentType": "FULL_TIME",
  "status": "ACTIVE",
  "salary": 50000.00,
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
PATCH /api/employees/:id
```

**Request Body:** (all fields optional)
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "employmentType": "PART_TIME",
  "status": "ON_LEAVE",
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
| `FULL_TIME` | Full-time employee |
| `PART_TIME` | Part-time employee |
| `CONTRACT` | Contract worker |
| `INTERN` | Intern |

#### Employee Status
| Value | Description |
|-------|-------------|
| `ACTIVE` | Currently active |
| `INACTIVE` | Inactive employee |
| `ON_LEAVE` | On leave |
| `PROBATION` | Probation period |
| `TERMINATED` | Employment terminated |

---

## Attendance Module

### Enhanced Attendance Tracking

The Attendance module now includes work hours calculation, overtime tracking, and notes.

### Endpoints

#### Get Attendances
```http
GET /api/attendances
```

**Response includes new fields:**
```json
{
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "status": "PRESENT",
      "date": "2026-01-27T00:00:00.000Z",
      "checkInTime": "2026-01-27T08:00:00.000Z",
      "checkOutTime": "2026-01-27T17:30:00.000Z",
      "workHours": 9.5,
      "overtime": 1.5,
      "notes": "Completed project milestone",
      "performBy": "uuid",
      "performer": { ... },
      "employee": { ... },
      "isActive": true,
      "createdAt": "2026-01-27T08:00:00.000Z",
      "updatedAt": "2026-01-27T17:30:00.000Z"
    }
  ]
}
```

#### Check Out
```http
POST /api/attendances/check-out
```

**Request Body:**
```json
{
  "employeeId": "uuid-employee",
  "notes": "Worked on project X"
}
```

**Auto-calculated fields on check-out:**
- `workHours`: Total hours worked (checkOut - checkIn)
- `overtime`: Hours beyond standard 8-hour day (workHours - 8, minimum 0)

---

## Audit Logs Module

### Enhanced Audit Logging

Audit logs now include IP address, user agent, severity level, and success status.

### Endpoints

#### Get Audit Logs
```http
GET /api/audit-logs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `userId` | string (UUID) | Filter by user |
| `action` | string | Filter by action (CREATE, UPDATE, DELETE) |
| `tableName` | string | Filter by table name |
| `severity` | string | Filter by severity level |
| `success` | boolean | Filter by success status |
| `startDate` | string (ISO date) | Filter from date |
| `endDate` | string (ISO date) | Filter to date |

**Response:**
```json
{
  "data": [
    {
      "id": "log-uuid-123",
      "userId": "user-uuid-123",
      "action": "UPDATE",
      "tableName": "employees",
      "recordId": "record-uuid-123",
      "oldValue": { "status": "ACTIVE" },
      "newValue": { "status": "ON_LEAVE" },
      "timestamp": "2026-01-27T10:30:00.000Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "severity": "INFO",
      "success": true,
      "user": {
        "id": "user-uuid-123",
        "email": "john.doe@company.com",
        "firstname": "John",
        "lastname": "Doe"
      }
    }
  ]
}
```

### Enums

#### Attendance Status
| Value | Description |
|-------|-------------|
| `PRESENT` | Employee was present |
| `LATE` | Employee was late |
| `ABSENT` | Employee was absent |
| `HALF_DAY` | Half day attendance |

#### Audit Severity
| Value | Description | Use Case |
|-------|-------------|----------|
| `INFO` | Informational | Normal operations |
| `WARNING` | Warning | Potential issues |
| `ERROR` | Error | Operation failed |
| `CRITICAL` | Critical | System-level issues |

---

## Payroll Module

### New Payroll Endpoints

#### Get Payroll Summary
```http
GET /api/payroll/summary
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | number | No | Filter by year |
| `month` | number | No | Filter by month (1-12) |
| `departmentId` | string (UUID) | No | Filter by department |

**Response:**
```json
{
  "data": {
    "totalPayrolls": 100,
    "totalGrossSalary": 500000.00,
    "totalDeductions": 50000.00,
    "totalNetSalary": 450000.00,
    "totalTax": 10000.00,
    "totalOvertimePay": 5000.00,
    "totalBonus": 2000.00,
    "byStatus": [
      {
        "status": "PENDING",
        "count": 5,
        "totalAmount": 25000.00
      },
      {
        "status": "PROCESSED",
        "count": 80,
        "totalAmount": 400000.00
      },
      {
        "status": "PAID",
        "count": 15,
        "totalAmount": 75000.00
      }
    ],
    "byDepartment": [
      {
        "department": "Engineering",
        "employeeCount": 10,
        "totalSalary": 50000.00,
        "totalDeductions": 5000.00,
        "totalNetSalary": 45000.00
      }
    ]
  }
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

---

## Reports Module

### New Report Endpoints

All report endpoints require `ADMIN` or `HR` role.

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
  "data": [
    {
      "id": "uuid",
      "employeeCode": "EMP001",
      "fullName": "John Doe",
      "email": "john@example.com",
      "department": "Engineering",
      "position": "Software Engineer",
      "status": "ACTIVE",
      "employmentType": "FULL_TIME",
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
      "status": "PROCESSED"
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
| `X-RateLimit-Limit` | Maximum requests allowed (10 per minute) |
| `X-RateLimit-Reset` | Unix timestamp when the limit resets |

**Example:**
```http
X-RateLimit-Limit: 10
X-RateLimit-Reset: 1706364000
```

---

## TypeScript Interfaces

### Employee Types

```typescript
// Employment Type Enum
type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';

// Employee Status Enum
type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'TERMINATED';

// Emergency Contact
interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

// Bank Details
interface BankDetails {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

// Employee DTO
interface Employee {
  id: string;
  employeeCode: string;
  firstname: string;
  lastname: string;
  gender: 'male' | 'female' | 'unknown';
  dateOfBirth: string;
  userId: string;
  user: User | null;
  address: string;
  phoneNumber: string;
  profileImage: string | null;
  hireDate: Date;
  positionId: string;
  position: EmployeePosition;
  departmentId: string;
  department: Department;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  salary: number | null;
  emergencyContact: EmergencyContact | null;
  bankDetails: BankDetails | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

// Create Employee DTO
interface CreateEmployeeDto {
  firstname: string;
  lastname: string;
  employeeCode: string;
  gender: 0 | 1; // 0: Male, 1: Female
  dob: string;
  address?: string;
  phone?: string;
  profileImage?: string;
  hireDate: string;
  departmentId: string;
  positionId: string;
  managerId?: string;
  employmentType?: EmploymentType;
  status?: EmployeeStatus;
  salary?: number;
  emergencyContact?: EmergencyContact;
  bankDetails?: BankDetails;
  username: string;
  email: string;
  roleName: 'employee' | 'hr';
}
```

### Attendance Types

```typescript
interface Attendance {
  id: string;
  employeeId: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY';
  date: Date;
  checkInTime: Date;
  checkOutTime: Date | null;
  workHours: number | null;
  overtime: number | null;
  notes: string | null;
  performBy: string;
  performer: User | null;
  employee: Employee | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

interface CheckOutDto {
  employeeId: string;
  notes?: string;
}
```

### Audit Log Types

```typescript
type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface AuditLogUser {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
}

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  severity: AuditSeverity;
  success: boolean;
  user?: AuditLogUser;
}
```

### Payroll Types

```typescript
interface PayrollSummaryByStatus {
  status: string;
  count: number;
  totalAmount: number;
}

interface PayrollSummaryByDepartment {
  department: string;
  employeeCount: number;
  totalSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
}

interface PayrollSummary {
  totalPayrolls: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalTax: number;
  totalOvertimePay: number;
  totalBonus: number;
  byStatus: PayrollSummaryByStatus[];
  byDepartment?: PayrollSummaryByDepartment[];
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
  hireDate: Date;
  salary: number | null;
}

interface PayrollReportData {
  id: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
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
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email"
    }
  ]
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

### Employee Management
- [ ] Employee list with pagination and filters
- [ ] Employee detail view with new fields
- [ ] Create employee form with emergency contact and bank details
- [ ] Edit employee form with all updatable fields
- [ ] Employee status badge component
- [ ] Employment type selector

### Attendance
- [ ] Attendance list with work hours display
- [ ] Check-out form with notes field
- [ ] Overtime hours display
- [ ] Work hours summary component

### Audit Logs
- [ ] Audit log viewer with severity filters
- [ ] IP address and user agent display
- [ ] Success/failure status indicator
- [ ] Severity badge component (INFO, WARNING, ERROR, CRITICAL)

### Payroll
- [ ] Payroll summary dashboard
- [ ] Bulk payroll generation form
- [ ] Department-wise payroll breakdown
- [ ] Status-wise payroll statistics

### Reports
- [ ] Employee report page with filters
- [ ] Payroll report page with filters
- [ ] Comprehensive dashboard with all metrics
- [ ] Export buttons (XLSX/CSV) for reports

---

*Last updated: January 30, 2026*
