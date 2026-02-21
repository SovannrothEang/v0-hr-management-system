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
import { Loader2 } from "lucide-react";
import { useUpdateEmployee } from "@/hooks/use-employees";
import type { Employee } from "@/stores/employee-store";

interface ProfileEditDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export function ProfileEditDialog({
  employee,
  open,
  onOpenChange,
  onSuccess,
}: ProfileEditDialogProps) {
  const { mutate: updateEmployee, isPending } = useUpdateEmployee();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      phone: employee.phone,
      address: employee.address || "",
      emergencyContact: {
        name: employee.emergencyContact?.name || "",
        phone: employee.emergencyContact?.phone || "",
        relationship: employee.emergencyContact?.relationship || "",
      },
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        address: employee.address || "",
        emergencyContact: {
          name: employee.emergencyContact?.name || "",
          phone: employee.emergencyContact?.phone || "",
          relationship: employee.emergencyContact?.relationship || "",
        },
      });
    }
  }, [open, employee, reset]);

  const onSubmit = (data: FormData) => {
    updateEmployee(
      { id: employee.id, original: employee, modified: data },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
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
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register("phone")}
              className="bg-input border-border"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register("address")}
              className="bg-input border-border"
              placeholder="123 Main St, City, Country"
            />
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-medium">Emergency Contact</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="emergencyName">Contact Name</Label>
                <Input
                  id="emergencyName"
                  {...register("emergencyContact.name")}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  {...register("emergencyContact.phone")}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyRel">Relationship</Label>
                <Input
                  id="emergencyRel"
                  {...register("emergencyContact.relationship")}
                  className="bg-input border-border"
                />
              </div>
            </div>
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
