"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/use-employees";
import { useDepartments } from "@/hooks/use-departments";
import type { Employee, EmploymentType, EmploymentStatus } from "@/stores/employee-store";

interface EmployeeFormDialogProps {
  employee?: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  hireDate: string;
  salary: number;
  address?: string;
}

export function EmployeeFormDialog({
  employee,
  open,
  onOpenChange,
}: EmployeeFormDialogProps) {
  const isEditing = !!employee;
  const { data: deptResult } = useDepartments();
  const { mutate: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();

  const departments = deptResult?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      employmentType: "full_time",
      status: "active",
      hireDate: new Date().toISOString().split("T")[0],
      salary: 50000,
      address: "",
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        employmentType: employee.employmentType,
        status: employee.status,
        hireDate: new Date(employee.hireDate).toISOString().split("T")[0],
        salary: employee.salary,
        address: employee.address || "",
      });
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        employmentType: "full_time",
        status: "active",
        hireDate: new Date().toISOString().split("T")[0],
        salary: 50000,
        address: "",
      });
    }
  }, [employee, reset]);

  const onSubmit = (data: FormData) => {
    if (isEditing && employee) {
      // Normalize the original date to YYYY-MM-DD to match the form data format
      // This prevents false positive changes detection due to ISO string vs Date string
      const normalizedOriginal = {
        ...employee,
        hireDate: new Date(employee.hireDate).toISOString().split("T")[0],
      };

      updateEmployee(
        { id: employee.id, original: normalizedOriginal, modified: data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createEmployee(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the employee's information below."
              : "Fill in the details to add a new employee."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register("firstName", { required: "First name is required" })}
                className="bg-input border-border"
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register("lastName", { required: "Last name is required" })}
                className="bg-input border-border"
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email", { required: "Email is required" })}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone", { required: "Phone is required" })}
              className="bg-input border-border"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={watch("department")}
                onValueChange={(value) => setValue("department", value)}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                {...register("position", { required: "Position is required" })}
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select
                value={watch("employmentType")}
                onValueChange={(value) =>
                  setValue("employmentType", value as EmploymentType)
                }
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) =>
                  setValue("status", value as EmploymentStatus)
                }
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input
                id="hireDate"
                type="date"
                {...register("hireDate", { required: "Hire date is required" })}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Annual Salary ($)</Label>
              <Input
                id="salary"
                type="number"
                {...register("salary", {
                  required: "Salary is required",
                  valueAsNumber: true,
                })}
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              id="address"
              {...register("address")}
              className="bg-input border-border"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
