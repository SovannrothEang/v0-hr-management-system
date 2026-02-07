"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { AttendanceTable } from "@/components/attendances/attendance-table";
import { LeaveRequestTable } from "@/components/attendances/leave-request-table";
import { PayrollTable } from "@/components/payrolls/payroll-table";
import { useEmployee } from "@/hooks/use-employees";
import { useAttendanceRecords } from "@/hooks/use-attendance";
import { useLeaveRequests } from "@/hooks/use-attendance";
import { usePayrollRecords } from "@/hooks/use-payroll";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  User,
  AlertCircle,
  Pencil,
  ChevronLeft,
  Clock,
  FileText,
  CreditCard,
} from "lucide-react";
import type { EmploymentStatus } from "@/stores/employee-store";

interface EmployeePageProps {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<
  EmploymentStatus,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-success/20 text-success" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground" },
  on_leave: { label: "On Leave", className: "bg-secondary text-secondary-foreground" },
  probation: { label: "Probation", className: "bg-warning/20 text-warning" },
  terminated: { label: "Terminated", className: "bg-destructive/20 text-destructive" },
};

const employmentTypeLabels = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  intern: "Intern",
};

export default function EmployeePage({ params }: EmployeePageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Data hooks
  const { data: employee, isLoading: employeeLoading } = useEmployee(id);
  const { data: attendanceResult, isLoading: attendanceLoading } = useAttendanceRecords({ employeeId: id, limit: 10 });
  const { data: leaveResult, isLoading: leaveLoading } = useLeaveRequests({ employeeId: id, limit: 10 });
  const { data: payrollResult, isLoading: payrollLoading } = usePayrollRecords({ employeeId: id });

  const { isAdmin, isHRManager, user } = usePermissions();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const canEdit = isAdmin || isHRManager || (user?.employeeId === id);
  const isManager = isAdmin || isHRManager;

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.[0] ?? "";
    const l = lastName?.[0] ?? "";
    const initials = `${f}${l}`.toUpperCase();
    return initials || "??";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (employeeLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="items-center pb-2">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <h2 className="text-xl font-semibold">Employee not found</h2>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to list
        </Button>
        {canEdit && (
          <Button size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Profile Card */}
        <Card className="lg:col-span-1 border-border bg-card shadow-sm h-fit">
          <CardHeader className="items-center text-center pb-6">
            <Avatar className="h-24 w-24 ring-4 ring-secondary/50">
              <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.firstName} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {getInitials(employee.firstName, employee.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 space-y-1">
              <CardTitle className="text-xl">
                {employee.firstName} {employee.lastName}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">
                {employee.position}
              </p>
              <Badge className={cn("mt-2 border-0", (statusConfig[employee.status] || statusConfig.active).className)}>
                {(statusConfig[employee.status] || statusConfig.active).label}
              </Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <span>{employee.department}</span>
            </div>
            {employee.address && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <span>{employee.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Area with Tabs */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-secondary/50 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="leave">Leave Requests</TabsTrigger>
              {isManager && <TabsTrigger value="payroll">Payroll</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Employment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Employee ID</span>
                      <span className="text-sm font-mono">{employee.employeeId}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Employment Type</span>
                      <span className="text-sm">{employmentTypeLabels[employee.employmentType as keyof typeof employmentTypeLabels] || employee.employmentType || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Hire Date</span>
                      <span className="text-sm">{employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "N/A"}</span>
                    </div>
                    {(isAdmin || isHRManager) && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Annual Salary</span>
                        <span className="text-sm font-semibold">{formatCurrency(employee.salary)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {employee.emergencyContact && (
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-warning" />
                        Emergency Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="text-sm">{employee.emergencyContact.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Relationship</span>
                        <span className="text-sm">{employee.emergencyContact.relationship}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <span className="text-sm">{employee.emergencyContact.phone}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Recent Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">94%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Attendance rate this month
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Available Leave
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12 Days</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Annual leave balance
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>Recent clock-in and clock-out records.</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <AttendanceTable
                      records={attendanceResult?.data || []}
                      employees={employee ? [employee] : []}
                      onClockIn={() => { }}
                      onClockOut={() => { }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leave" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>History of leave applications and their status.</CardDescription>
                </CardHeader>
                <CardContent>
                  {leaveLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <LeaveRequestTable
                      requests={leaveResult?.data || []}
                      onApprove={() => { }}
                      onReject={() => { }}
                      showActions={isManager}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isManager && (
              <TabsContent value="payroll" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payroll Records</CardTitle>
                    <CardDescription>Historical salary and payment information.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payrollLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <PayrollTable
                        records={Array.isArray(payrollResult) ? payrollResult : []}
                        onViewPayslip={() => { }}
                        onProcess={() => { }}
                        onMarkPaid={() => { }}
                        showActions={false}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <EmployeeFormDialog
        employee={employee}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}
