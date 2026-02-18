"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mail,
  Calendar,
  Shield,
  User,
  Pencil,
  Phone,
  MapPin,
  CreditCard,
  Users,
  AtSign,
} from "lucide-react";
import type { User as UserType } from "@/stores/user-store";

interface UserDetailSheetProps {
  user: UserType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (user: UserType) => void;
}

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-destructive/20 text-destructive" },
  hr_manager: { label: "HR Manager", className: "bg-secondary text-secondary-foreground" },
  employee: { label: "Employee", className: "bg-success/20 text-success" },
};

export function UserDetailSheet({
  user,
  open,
  onOpenChange,
  onEdit,
}: UserDetailSheetProps) {
  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.firstName} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">
                  {user.firstName} {user.lastName}
                </SheetTitle>
                <SheetDescription className="text-sm">
                  {user.email}
                </SheetDescription>
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.roles.map((role) => (
                    <Badge key={role} className={cn(roleConfig[role]?.className || "bg-muted")}>
                      {roleConfig[role]?.label || role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onEdit(user)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit User
          </Button>
        </SheetHeader>

        <Separator />

        <div className="space-y-6 py-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.username && (
                <div className="flex items-center gap-3 text-sm">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <span>@{user.username}</span>
                </div>
              )}
              {user.employee?.phoneNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.employee.phoneNumber}</span>
                </div>
              )}
              {user.employee?.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{user.employee.address}</span>
                </div>
              )}
              {user.employee?.employeeCode && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Employee Code: {user.employee.employeeCode}</span>
                </div>
              )}
              {user.employee?.department?.name && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Department: {user.employee.department.name}</span>
                </div>
              )}
              {user.employee?.position?.name && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Position: {user.employee.position.name}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* User Details */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              User Details
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">User ID</span>
                </div>
                <span className="text-sm font-mono">{user.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Status</span>
                </div>
                <Badge variant={user.isActive ? "default" : "outline"} className={cn(user.isActive && "bg-success/20 text-success border-0")}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Created</span>
                </div>
                <span className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                </div>
                <span className="text-sm">
                  {new Date(user.updatedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
             </div>
           </div>

           {/* Emergency Contact */}
           {user.employee?.emergencyContact && (
             <>
               <Separator />
               <div>
                 <h3 className="text-sm font-medium text-muted-foreground mb-3">
                   Emergency Contact
                 </h3>
                 <div className="space-y-3">
                   {user.employee.emergencyContact.name && (
                     <div className="flex items-center gap-3 text-sm">
                       <Users className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <span className="font-medium">{user.employee.emergencyContact.name}</span>
                         {user.employee.emergencyContact.relationship && (
                           <span className="text-muted-foreground ml-2">
                             ({user.employee.emergencyContact.relationship})
                           </span>
                         )}
                       </div>
                     </div>
                   )}
                   {user.employee.emergencyContact.phone && (
                     <div className="flex items-center gap-3 text-sm">
                       <Phone className="h-4 w-4 text-muted-foreground" />
                       <span>{user.employee.emergencyContact.phone}</span>
                     </div>
                   )}
                 </div>
               </div>
             </>
           )}

           {/* Banking Details */}
           {user.employee?.bankDetails && (
             <>
               <Separator />
               <div>
                 <h3 className="text-sm font-medium text-muted-foreground mb-3">
                   Banking Details
                 </h3>
                 <div className="space-y-3">
                   {user.employee.bankDetails.bankName && (
                     <div className="flex items-center gap-3 text-sm">
                       <CreditCard className="h-4 w-4 text-muted-foreground" />
                       <span>{user.employee.bankDetails.bankName}</span>
                     </div>
                   )}
                   {user.employee.bankDetails.accountNumber && (
                     <div className="flex items-center gap-3 text-sm">
                       <CreditCard className="h-4 w-4 text-muted-foreground" />
                       <span className="font-mono">{user.employee.bankDetails.accountNumber}</span>
                     </div>
                   )}
                   {user.employee.bankDetails.accountName && (
                     <div className="flex items-center gap-3 text-sm">
                       <User className="h-4 w-4 text-muted-foreground" />
                       <span>{user.employee.bankDetails.accountName}</span>
                     </div>
                   )}
                 </div>
               </div>
             </>
           )}
         </div>
       </SheetContent>
    </Sheet>
  );
}