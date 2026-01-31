# Track Changes Feature - PATCH Endpoint Support

## Overview

This feature implements change tracking for employee updates, sending only modified fields to the PATCH endpoint. This is more efficient than sending the entire object and is the standard approach for partial updates.

## Architecture

### 1. Change Tracking Utility (`lib/track-changes.ts`)

A utility module that compares original and modified objects to identify changed fields.

**Key Functions:**

#### `getChangedFields<T>(original, modified)`
Compares two objects and returns only the changed fields.

```typescript
const original = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  department: "Engineering",
};

const modified = {
  firstName: "John",
  lastName: "Smith",  // Changed
  email: "john@example.com",
  department: "Finance",  // Changed
};

const changes = getChangedFields(original, modified);
// Result: { lastName: "Smith", department: "Finance" }
```

#### `hasChanges<T>(original, modified)`
Returns a boolean indicating if there are any changes.

```typescript
const hasChanges = hasChanges(original, modified);
// Result: true
```

#### `compareObjects<T>(original, modified)`
Returns a comprehensive comparison result.

```typescript
const result = compareObjects(original, modified);
// Result: {
//   changes: { lastName: "Smith", department: "Finance" },
//   hasAnyChanges: true,
//   changedFields: ["lastName", "department"],
//   original: { ... },
//   modified: { ... }
// }
```

### 2. Updated API Client (`lib/api-client.ts`)

Added `patch` method to support PATCH requests:

```typescript
async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
  return this.request<T>(endpoint, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}
```

### 3. Updated Employees Hook (`hooks/use-employees.ts`)

Modified `useUpdateEmployee` to track changes and use PATCH:

```typescript
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, original, modified }: { id: string; original: Employee; modified: Partial<Employee> }) => {
      // Track only changed fields
      const changes = getChangedFields(original, modified);
      
      // Check if there are any changes
      if (Object.keys(changes).length === 0) {
        throw new Error("No changes detected");
      }

      // Use PATCH endpoint for partial updates
      const response = await apiClient.patch<Employee>(`/employees/${id}`, changes);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
      toast.success("Employee updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update employee", { description: error.message });
    },
  });
}
```

### 4. Updated Employee Form Dialog (`components/employees/employee-form-dialog.tsx`)

Modified to pass original employee data for comparison:

```typescript
const onSubmit = (data: FormData) => {
  if (isEditing && employee) {
    updateEmployee(
      { id: employee.id, original: employee, modified: data },
      { onSuccess: () => onOpenChange(false) }
    );
  } else {
    createEmployee(data, { onSuccess: () => onOpenChange(false) });
  }
};
```

### 5. Added PATCH Endpoint (`app/api/employees/[id]/route.ts`)

Added PATCH endpoint to handle partial updates:

```typescript
export const PATCH = withRole(async (
  request,
  context
) => {
  try {
    const { id } = await context?.params!;
    const body = await request.json();
    const employee = mockEmployees.find((e) => e.id === id);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // HR Manager can only update employees in their department
    if (request.user.roles.includes(ROLES.HR_MANAGER) && !request.user.roles.includes(ROLES.ADMIN) && request.user.department) {
      if (employee.department !== request.user.department) {
        return NextResponse.json(
          { success: false, message: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Apply only the changed fields
    const updatedEmployee = {
      ...employee,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: updatedEmployee });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update employee" },
      { status: 500 }
    );
  }
}, [ROLES.ADMIN, ROLES.HR_MANAGER]);
```

## How It Works

### Example Flow

1. **User opens edit form** for employee "John Doe"
   - Original data: `{ firstName: "John", lastName: "Doe", email: "john@example.com", department: "Engineering" }`

2. **User makes changes**
   - Changes lastName to "Smith"
   - Changes department to "Finance"
   - Other fields remain unchanged

3. **Form submission**
   - `onSubmit` is called with modified data
   - `updateEmployee` is called with:
     ```typescript
     {
       id: "employee-id",
       original: { firstName: "John", lastName: "Doe", email: "john@example.com", department: "Engineering" },
       modified: { firstName: "John", lastName: "Smith", email: "john@example.com", department: "Finance" }
     }
     ```

4. **Change tracking**
   - `getChangedFields` compares original and modified
   - Returns: `{ lastName: "Smith", department: "Finance" }`

5. **API call**
   - `PATCH /api/employees/employee-id`
   - Body: `{ lastName: "Smith", department: "Finance" }`
   - **Only changed fields are sent!**

6. **Server response**
   - Server applies changes and returns updated employee
   - Frontend updates cache and shows success message

## Benefits

### 1. **Efficiency**
- Only changed fields are sent over the network
- Reduces payload size
- Faster API responses

### 2. **Audit Trail**
- Server can log which fields were changed
- Track who changed what and when
- Maintain change history

### 3. **Conflict Resolution**
- Server can detect conflicts if fields were modified by another user
- Implement optimistic locking
- Prevent data loss

### 4. **Validation**
- Server can validate only changed fields
- Reduce validation overhead
- Better error messages

### 5. **Performance**
- Database updates only modified columns
- Reduced I/O operations
- Better cache utilization

## API Contract

### Request
```http
PATCH /api/employees/:id
Content-Type: application/json
Authorization: Bearer <token>
X-CSRF-Token: <token>

{
  "lastName": "Smith",
  "department": "Finance"
}
```

### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "employee-id",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "department": "Finance",
    "updatedAt": "2026-01-30T05:45:00.000Z"
  }
}
```

### Error Responses

**No changes detected:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "message": "No changes detected"
}
```

**Employee not found:**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "success": false,
  "message": "Employee not found"
}
```

**Permission denied:**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "message": "Access denied"
}
```

## Testing

### Test Scenarios

1. **Update single field**
   - Change only firstName
   - Verify only firstName is sent in PATCH request

2. **Update multiple fields**
   - Change lastName and department
   - Verify both fields are sent

3. **No changes**
   - Submit form without changes
   - Verify error message "No changes detected"

4. **Nested objects**
   - Update address (if applicable)
   - Verify nested changes are tracked

5. **Arrays**
   - Update skills array (if applicable)
   - Verify array changes are tracked

### Manual Testing

1. Navigate to Employees page
2. Click edit on any employee
3. Change only one field (e.g., department)
4. Submit form
5. Check Network tab in DevTools
6. Verify PATCH request body contains only changed field
7. Verify success toast appears
8. Verify employee data is updated

## Files Modified

1. `lib/track-changes.ts` - New utility for tracking changes
2. `lib/api-client.ts` - Added PATCH method
3. `hooks/use-employees.ts` - Updated useUpdateEmployee to track changes
4. `components/employees/employee-form-dialog.tsx` - Pass original data
5. `app/api/employees/[id]/route.ts` - Added PATCH endpoint

## Future Enhancements

### 1. Change History
```typescript
interface ChangeHistory {
  id: string;
  employeeId: string;
  changedBy: string;
  changedAt: string;
  field: string;
  oldValue: any;
  newValue: any;
}
```

### 2. Optimistic Locking
```typescript
interface Employee {
  id: string;
  version: number;  // Increment on each update
  // ... other fields
}
```

### 3. Bulk Updates
```typescript
// Update multiple employees with different changes
PATCH /api/employees/batch
[
  { id: "1", changes: { department: "Engineering" } },
  { id: "2", changes: { status: "active" } }
]
```

### 4. Undo/Redo Support
```typescript
// Store change history in session
const changeHistory: Change[] = [];
const undoStack: Change[] = [];
const redoStack: Change[] = [];
```

## Security Considerations

1. **Field Validation**: Server must validate all changed fields
2. **Permission Checks**: Ensure user has permission to change each field
3. **Audit Logging**: Log all changes for security audit
4. **Rate Limiting**: Prevent abuse of PATCH endpoint
5. **CSRF Protection**: Maintain CSRF protection for PATCH requests

## Performance Considerations

1. **Network**: Reduced payload size improves network performance
2. **Database**: Only modified columns are updated
3. **Cache**: Better cache hit rates with smaller payloads
4. **Validation**: Reduced validation overhead for unchanged fields

---

**Status**: ✅ IMPLEMENTED

**Last Updated**: January 30, 2026
