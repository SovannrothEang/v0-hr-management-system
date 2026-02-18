"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Position, CreatePositionData } from "@/hooks/use-positions";

const positionSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be at most 100 characters"),
    description: z
      .string()
      .max(255, "Description must be at most 255 characters")
      .optional()
      .or(z.literal("")),
    salaryRangeMin: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .min(0, "Minimum salary must be at least 0"),
    salaryRangeMax: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .max(99999999, "Maximum salary cannot exceed 99,999,999"),
  })
  .refine((data) => data.salaryRangeMax >= data.salaryRangeMin, {
    message: "Maximum salary must be greater than or equal to minimum salary",
    path: ["salaryRangeMax"],
  });

interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: Position | null;
  onSubmit: (data: CreatePositionData) => void;
  isPending: boolean;
}

export function PositionFormDialog({
  open,
  onOpenChange,
  position,
  onSubmit,
  isPending,
}: PositionFormDialogProps) {
  const isEditing = !!position;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [salaryRangeMin, setSalaryRangeMin] = useState("");
  const [salaryRangeMax, setSalaryRangeMax] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (position) {
        setTitle(position.title);
        setDescription(position.description || "");
        setSalaryRangeMin(position.salaryRangeMin.toString());
        setSalaryRangeMax(position.salaryRangeMax.toString());
      } else {
        setTitle("");
        setDescription("");
        setSalaryRangeMin("");
        setSalaryRangeMax("");
      }
      setErrors({});
    }
  }, [open, position]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = positionSchema.safeParse({
      title,
      description,
      salaryRangeMin: salaryRangeMin || 0,
      salaryRangeMax: salaryRangeMax || 0,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0]?.toString();
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit({
      title: result.data.title,
      description: result.data.description || undefined,
      salaryRangeMin: result.data.salaryRangeMin,
      salaryRangeMax: result.data.salaryRangeMax,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Position" : "Add New Position"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the position details below."
              : "Fill in the details to create a new position."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="positionTitle">Title</Label>
            <Input
              id="positionTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Software Engineer"
              disabled={isPending}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="positionDescription">Description</Label>
            <Textarea
              id="positionDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the position (optional)"
              disabled={isPending}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryRangeMin">Min Salary ($)</Label>
              <Input
                id="salaryRangeMin"
                type="number"
                min={0}
                value={salaryRangeMin}
                onChange={(e) => setSalaryRangeMin(e.target.value)}
                placeholder="0"
                disabled={isPending}
              />
              {errors.salaryRangeMin && (
                <p className="text-sm text-destructive">{errors.salaryRangeMin}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryRangeMax">Max Salary ($)</Label>
              <Input
                id="salaryRangeMax"
                type="number"
                min={0}
                value={salaryRangeMax}
                onChange={(e) => setSalaryRangeMax(e.target.value)}
                placeholder="0"
                disabled={isPending}
              />
              {errors.salaryRangeMax && (
                <p className="text-sm text-destructive">{errors.salaryRangeMax}</p>
              )}
            </div>
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
            <Button type="submit" disabled={isPending}>
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
