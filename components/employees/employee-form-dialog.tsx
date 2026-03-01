"use client";

import { useEffect, useState } from "react";
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
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { useCreateEmployee, useUpdateEmployee, useUploadEmployeeImage, useRemoveEmployeeImage, type CreateEmployeeData } from "@/hooks/use-employees";
import { useAllDepartments } from "@/hooks/use-departments";
import { usePositionDropdown } from "@/hooks/use-positions";
import { ImageUpload } from "@/components/ui/image-upload";
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
  department: {
    id: string;
    departmentName: string;
  };
  departmentId: string;
  position: string;
  positionId: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  hireDate: string;
  salary: number;
  address?: string;
  gender?: "male" | "female";
  dateOfBirth?: string;
}

export function EmployeeFormDialog({
  employee,
  open,
  onOpenChange,
}: EmployeeFormDialogProps) {
  const isEditing = !!employee;
  const { data: deptResult } = useAllDepartments();
  const { data: positionsResult } = usePositionDropdown();
  const { mutate: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const { mutate: uploadImage } = useUploadEmployeeImage();
  const { mutate: removeImage } = useRemoveEmployeeImage();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);

  const departments = [...(deptResult || [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const positions = [...(positionsResult || [])].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

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
      department: {
        id: "",
        departmentName: "",
      },
      departmentId: "",
      position: "",
      positionId: "",
      employmentType: "full_time",
      status: "active",
      hireDate: new Date().toISOString().split("T")[0],
      salary: 50000,
      address: "",
      gender: "male",
      dateOfBirth: "",
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
        departmentId: employee.departmentId || employee.department?.id || "",
        position: employee.position,
        positionId: employee.positionId || "",
        employmentType: employee.employmentType,
        status: employee.status,
        hireDate: new Date(employee.hireDate).toISOString().split("T")[0],
        salary: employee.salary,
        address: employee.address || "",
        gender: (employee.gender as "male" | "female") || "male",
        dateOfBirth: employee.dateOfBirth || "",
      });
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: {
          id: "",
          departmentName: "",
        },
        departmentId: "",
        position: "",
        positionId: "",
        employmentType: "full_time",
        status: "active",
        hireDate: new Date().toISOString().split("T")[0],
        salary: 50000,
        address: "",
        gender: "male",
        dateOfBirth: "",
      });
    }
  }, [employee, reset]);

  const onSubmit = (data: FormData) => {
    // Validate required fields
    if (!data.departmentId) {
      toast.error("Please select a department");
      return;
    }
    if (!data.positionId) {
      toast.error("Please select a position");
      return;
    }

    const handleImageAction = (userId: string) => {
      if (!userId) return;
      if (shouldRemoveImage) {
        removeImage(userId);
      } else if (selectedFile) {
        uploadImage({ userId, file: selectedFile });
      }
    };

    // Prepare data for API
    const employeeData: CreateEmployeeData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      departmentId: data.departmentId,
      positionId: data.positionId,
      position: data.position,
      employmentType: data.employmentType,
      status: data.status,
      hireDate: data.hireDate,
      salary: data.salary,
      address: data.address,
      gender: (data.gender as "male" | "female") || "male",
      dateOfBirth: data.dateOfBirth,
    };

    if (isEditing && employee) {
      const normalizedOriginal = {
        ...employee,
        hireDate: new Date(employee.hireDate).toISOString().split("T")[0],
      };

      updateEmployee(
        { id: employee.id, original: normalizedOriginal, modified: employeeData },
        {
          onSuccess: (updatedEmp) => {
            if (employee.userId) {
              handleImageAction(employee.userId);
            }
            onOpenChange(false);
          }
        }
      );
    } else {
      createEmployee(employeeData, {
        onSuccess: (newEmp) => {
          if (selectedFile && newEmp.userId) {
            uploadImage({ userId: newEmp.userId, file: selectedFile });
          }
          onOpenChange(false);
        }
      });
    }
  };

  const isPending = isCreating || isUpdating;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setSelectedFile(null);
        setShouldRemoveImage(false);
      }
      onOpenChange(val);
    }}>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ImageUpload
            value={employee?.avatar}
            onChange={setSelectedFile}
            onRemove={() => setShouldRemoveImage(true)}
            fallbackInitials={getInitials(watch("firstName"), watch("lastName"))}
            disabled={isPending}
          />

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
              {...register("phone", {})}
              className="bg-input border-border"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={watch("departmentId")}
                onValueChange={(value) => {
                  const selectedDept = departments.find((d) => d.id === value);
                  setValue("departmentId", value);
                  setValue("department", {
                    id: value,
                    departmentName: selectedDept?.name || "",
                  });
                }}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={watch("positionId")}
                onValueChange={(value) => {
                  const selectedPosition = positions.find((p) => p.id === value);
                  setValue("positionId", value);
                  setValue("position", selectedPosition?.title || "");
                }}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {positions?.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
