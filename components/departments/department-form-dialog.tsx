"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Department } from "@/hooks/use-departments";

const departmentSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .max(100, "Name must be at most 100 characters"),
});

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  onSubmit: (data: { name: string }) => void;
  isPending: boolean;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSubmit,
  isPending,
}: DepartmentFormDialogProps) {
  const isEditing = !!department;

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (department) {
        setName(department.name);
      } else {
        setName("");
      }
      setError("");
    }
  }, [open, department]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = departmentSchema.safeParse({ name });

    if (!result.success) {
      const firstError = result.error.issues[0];
      if (firstError) {
        setError(firstError.message);
      }
      return;
    }

    setError("");
    onSubmit({ name: result.data.name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Department" : "Add New Department"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the department name below."
              : "Enter the name of the new department."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="departmentName">Department Name</Label>
            <Input
              id="departmentName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering"
              disabled={isPending}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
