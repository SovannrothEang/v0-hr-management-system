"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import {
  useLeaveBalances,
  useCreateLeaveBalance,
  useUpdateLeaveBalance,
  useDeleteLeaveBalance,
  useEmployeeLeaveBalance,
  type LeaveBalance,
} from "@/hooks/use-leave-balances";
import { useEmployees } from "@/hooks/use-employees";

const LEAVE_TYPES = [
  { value: "ANNUAL_LEAVE", label: "Annual Leave", defaultDays: 15 },
  { value: "SICK_LEAVE", label: "Sick Leave", defaultDays: 10 },
  { value: "CASUAL_LEAVE", label: "Casual Leave", defaultDays: 5 },
  { value: "BEREAVEMENT_LEAVE", label: "Bereavement Leave", defaultDays: 3 },
  { value: "FAMILY_MEDICAL_LEAVE", label: "Family Medical Leave", defaultDays: 5 },
  { value: "MENTAL_HEALTH_DAYS", label: "Mental Health Days", defaultDays: 2 },
  { value: "PUBLIC_HOLIDAY", label: "Public Holiday", defaultDays: 0 },
  { value: "UNPAID_LEAVE", label: "Unpaid Leave", defaultDays: 0 },
  { value: "STUDY_LEAVE", label: "Study Leave", defaultDays: 0 },
  { value: "PARENTAL_LEAVE", label: "Parental Leave", defaultDays: 0 },
];

interface LeaveBalanceFormData {
  employeeId: string;
  leaveType: string;
  year: number;
  totalDays: number;
}

export function LeaveBalanceManagement() {
  const currentYear = new Date().getFullYear();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBalance, setEditingBalance] = useState<any>(null);
  
  const [formData, setFormData] = useState<LeaveBalanceFormData>({
    employeeId: "",
    leaveType: "",
    year: currentYear,
    totalDays: 0,
  });

  const { data: employees } = useEmployees({ limit: 100 });
  const { data: leaveBalances, isLoading } = useLeaveBalances({
    employeeId: selectedEmployeeId || undefined,
    year: selectedYear,
  });
  
  const { data: employeeBalance } = useEmployeeLeaveBalance(
    selectedEmployeeId,
    selectedYear
  );

  const createBalance = useCreateLeaveBalance();
  const updateBalance = useUpdateLeaveBalance();
  const deleteBalance = useDeleteLeaveBalance();

  const handleOpenDialog = (balance?: any) => {
    if (balance) {
      setIsEditMode(true);
      setEditingBalance(balance);
      setFormData({
        employeeId: balance.employeeId,
        leaveType: balance.leaveType,
        year: balance.year,
        totalDays: balance.totalDays,
      });
    } else {
      setIsEditMode(false);
      setEditingBalance(null);
      setFormData({
        employeeId: selectedEmployeeId || "",
        leaveType: "",
        year: selectedYear,
        totalDays: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingBalance(null);
    setFormData({
      employeeId: "",
      leaveType: "",
      year: currentYear,
      totalDays: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId) {
      toast.error("Please select an employee");
      return;
    }
    
    if (!formData.leaveType) {
      toast.error("Please select a leave type");
      return;
    }

    try {
      if (isEditMode && editingBalance) {
        await updateBalance.mutateAsync({
          id: editingBalance.id,
          data: { totalDays: formData.totalDays },
          employeeId: formData.employeeId,
        });
      } else {
        await createBalance.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async (balance: any) => {
    if (confirm("Are you sure you want to delete this leave balance?")) {
      await deleteBalance.mutateAsync({
        id: balance.id,
        employeeId: balance.employeeId,
      });
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    return LEAVE_TYPES.find((t) => t.value === type)?.label || type;
  };

  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance Management</CardTitle>
          <CardDescription>
            Manage employee leave balances for different leave types and years
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <Label>Employee</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.data?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-32">
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Balance
              </Button>
            </div>
          </div>

          {/* Employee Summary Card */}
          {employeeBalance && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {employeeBalance.employeeName}
                </CardTitle>
                <CardDescription>
                  Leave Balances for {employeeBalance.year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {employeeBalance.balances.map((balance) => (
                    <Card key={balance.id} className="bg-background">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">
                            {getLeaveTypeLabel(balance.leaveType)}
                          </h4>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenDialog(balance)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(balance)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-medium">{balance.totalDays}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Used:</span>
                            <span className="font-medium text-orange-600">
                              {balance.usedDays}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pending:</span>
                            <span className="font-medium text-yellow-600">
                              {balance.pendingDays}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t">
                            <span className="text-muted-foreground">Available:</span>
                            <span className="font-bold text-green-600">
                              {balance.availableDays}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Leave Balances Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">All Leave Balances</h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : leaveBalances && leaveBalances.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveBalances.map((balance: LeaveBalance) => (
                    <TableRow key={balance.id}>
                      <TableCell>
                        {employees?.data?.find(
                          (e) => e.id === balance.employeeId
                        )?.firstName || balance.employeeId}
                      </TableCell>
                      <TableCell>{getLeaveTypeLabel(balance.leaveType)}</TableCell>
                      <TableCell>{balance.year}</TableCell>
                      <TableCell className="text-right">{balance.totalDays}</TableCell>
                      <TableCell className="text-right">{balance.usedDays}</TableCell>
                      <TableCell className="text-right">{balance.pendingDays}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {balance.availableDays}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(balance)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(balance)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No leave balances found. Click "Add Balance" to create one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Leave Balance" : "Add Leave Balance"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the total days for this leave balance."
                : "Create a new leave balance for an employee."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, employeeId: value }))
                }
                disabled={isEditMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.data?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) => {
                  const leaveType = LEAVE_TYPES.find((t) => t.value === value);
                  setFormData((prev) => ({
                    ...prev,
                    leaveType: value,
                    totalDays: leaveType?.defaultDays || 0,
                  }));
                }}
                disabled={isEditMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    year: parseInt(value),
                  }))
                }
                disabled={isEditMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="totalDays">Total Days</Label>
              <Input
                id="totalDays"
                type="number"
                min="0"
                step="0.5"
                value={formData.totalDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalDays: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBalance.isPending || updateBalance.isPending}
              >
                {(createBalance.isPending || updateBalance.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
