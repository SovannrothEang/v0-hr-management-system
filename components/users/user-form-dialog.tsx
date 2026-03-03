"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useCreateUser, useUpdateUser, useUploadUserImage, useRemoveUserImage } from "@/hooks/use-users";
import type { User } from "@/stores/user-store";
import { ROLES, type RoleName } from "@/lib/constants/roles";
import { ImageUpload } from "@/components/ui/image-upload";
import { getChangedFields } from "@/lib/track-changes";

interface UserFormDialogProps {
  user?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  role: RoleName;
  isActive: boolean;
  password?: string;
  confirmPassword?: string;
}

export function UserFormDialog({
  user,
  open,
  onOpenChange,
}: UserFormDialogProps) {
  const isEditing = !!user;
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: uploadImage, isPending: isUploading } = useUploadUserImage();
  const { mutate: removeImage, isPending: isRemoving } = useRemoveUserImage();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

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
      role: ROLES.EMPLOYEE,
      isActive: true,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.roles[0] || ROLES.EMPLOYEE,
        isActive: user.isActive,
        password: "",
        confirmPassword: "",
      });
      setAvatarFile(null);
      setImageRemoved(false);
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        role: ROLES.EMPLOYEE,
        isActive: true,
        password: "",
        confirmPassword: "",
      });
      setAvatarFile(null);
      setImageRemoved(false);
    }
  }, [user, reset]);

  const onSubmit = (data: FormData) => {
    // For editing, don't send password if empty
    const payload: any = {
      email: data.email,
      roles: [data.role],
      isActive: data.isActive,
    };
    if (!isEditing) {
      payload.firstName = data.firstName;
      payload.lastName = data.lastName;
    }
    if (!isEditing && data.password) {
      payload.password = data.password;
    }

    const handleImageOperations = (userId: string, callback?: () => void) => {
      if (imageRemoved) {
        removeImage(userId, { onSuccess: callback });
      } else if (avatarFile) {
        uploadImage({ id: userId, file: avatarFile }, { onSuccess: callback });
      } else if (callback) {
        callback();
      }
    };

    if (isEditing && user) {
      const changes = getChangedFields(user, payload);
      const hasFieldChanges = Object.keys(changes).length > 0;
      const hasImageChanges = avatarFile !== null || imageRemoved;

      if (!hasFieldChanges && !hasImageChanges) {
        onOpenChange(false);
        return;
      }

      if (hasFieldChanges) {
        updateUser(
          { id: user.id, original: user, modified: payload },
          {
            onSuccess: () => {
              handleImageOperations(user.id, () => onOpenChange(false));
            },
          }
        );
      } else {
        handleImageOperations(user.id, () => onOpenChange(false));
      }
    } else {
      createUser(payload, {
        onSuccess: (newUser) => {
          if (newUser && newUser.id) {
            handleImageOperations(newUser.id, () => onOpenChange(false));
          } else {
            onOpenChange(false);
          }
        },
      });
    }
  };

  const isPending = isCreating || isUpdating || isUploading || isRemoving;
  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user information and permissions."
              : "Add a new user to the system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center pb-2">
              <ImageUpload
                value={user?.avatar}
                fallbackInitials={initials}
                onChange={(file) => {
                  setAvatarFile(file);
                  if (file) setImageRemoved(false);
                }}
                onRemove={() => {
                  setAvatarFile(null);
                  setImageRemoved(true);
                }}
                disabled={isPending}
              />
            </div>

            {!isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...register("firstName", { required: "First name is required" })}
                    placeholder="John"
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
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {!isEditing && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", {
                      required: !isEditing && "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword", {
                      validate: (value) =>
                        value === watch("password") || "Passwords do not match",
                    })}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={watch("role")}
                onValueChange={(value) => setValue("role", value as RoleName)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {key.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Active User</Label>
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
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
