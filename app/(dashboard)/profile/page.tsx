"use client";

import { useSessionStore } from "@/stores/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useEmployee } from "@/hooks/use-employees";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";
import {
  User,
  Mail,
  Shield,
  Building2,
  ExternalLink,
  Clock,
  Calendar,
  Settings,
  Camera,
  Loader2,
  Trash2,
  Edit,
  Phone,
  MapPin,
  UserRound
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, checkSession } = useSessionStore();
  const { data: employee, isLoading: isLoadingEmployee, refetch: refetchEmployee } = useEmployee(user?.employeeId || null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = user.id;

    if (!file || !targetId) {
      console.warn("Missing file or user ID for upload", { file: !!file, targetId });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type", { description: "Please upload an image file." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum image size is 5MB." });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log(`Uploading image for user ${targetId}...`);
      const response = await apiClient.postFormData(`/users/${targetId}/image`, formData);
      if (response.success) {
        toast.success("Profile image updated");
        await checkSession();
        await refetchEmployee();
      } else {
        toast.error(response.message || "Failed to update image");
      }
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error("Upload failed", { description: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    const targetId = user.id;
    if (!targetId) return;

    setIsDeleting(true);
    try {
      console.log(`Removing image for user ${targetId}...`);
      const response = await apiClient.delete(`/users/${targetId}/image`);
      if (response.success) {
        toast.success("Profile image removed");
        await checkSession();
        await refetchEmployee();
      } else {
        toast.error(response.message || "Failed to remove image");
      }
    } catch (error: any) {
      console.error("Image delete error:", error);
      toast.error("Remove failed", { description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProfileUpdateSuccess = async () => {
    await checkSession();
    await refetchEmployee();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
      <PageHeader
        title="My Profile"
        description="View and manage your account information"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Account Card */}
        <Card className="md:col-span-1 border-border bg-card">
          <CardHeader className="items-center justify-items-center text-center pb-2">
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <Avatar className="h-24 w-24 mb-4 ring-4 ring-primary/10 transition-transform group-hover:scale-105">
                <AvatarImage src={user.avatar ? `${user.avatar}?t=${Date.now()}` : "/placeholder.svg"} alt={user.username} className="object-cover w-full" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(user.username || "User")}
                </AvatarFallback>
              </Avatar>

              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <CardTitle className="text-xl">{user.username}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Mail className="h-3 w-3 mr-1" />
              {user.email}
            </CardDescription>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {user.roles.map(role => (
                <Badge key={role} variant="secondary" className="capitalize">
                  <Shield className="h-3 w-3 mr-1" />
                  {role.replace('_', ' ')}
                </Badge>
              ))}
            </div>

            {user.avatar && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-xs text-muted-foreground hover:text-destructive transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                disabled={isDeleting || isUploading}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Remove photo
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Separator />
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Building2 className="h-4 w-4 mr-2" />
                  Department
                </div>
                <span className="font-medium">{user.department || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground">
                  <User className="h-4 w-4 mr-2" />
                  Employee ID
                </div>
                <span className="font-mono">{user.employeeId || "N/A"}</span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
              {user.employeeId && (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => router.push(`/employees/${user.employeeId}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Full Record
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details & Activity */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Your contact and personal details.</CardDescription>
              </div>
              {employee && (
                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingEmployee ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                </div>
              ) : employee ? (
                <div className="grid gap-6 sm:grid-cols-2 mt-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Full Name</p>
                    <p className="font-medium text-sm flex items-center">
                      <UserRound className="h-4 w-4 mr-2 text-muted-foreground" />
                      {employee.firstName} {employee.lastName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone Number</p>
                    <p className="font-medium text-sm flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {employee.phone || "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Home Address</p>
                    <p className="font-medium text-sm flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {employee.address || "Not provided"}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Emergency Contact</p>
                    {employee.emergencyContact ? (
                      <div className="bg-muted/30 rounded-md p-3 mt-1">
                        <p className="text-sm font-medium">{employee.emergencyContact.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {employee.emergencyContact.relationship} • {employee.emergencyContact.phone}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">No detailed information found.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  Last Login
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Today, 09:45 AM</div>
                <p className="text-xs text-muted-foreground mt-1">From Chrome on Windows</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member Since
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employee ? new Date(employee.hireDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "January 2024"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Part of the HRFlow team</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Work Information</CardTitle>
              <CardDescription>Details about your current employment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Position</p>
                  <p className="font-medium mt-1">{employee?.position || "Staff Member"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Employment Type</p>
                  <p className="font-medium mt-1 capitalize">{employee?.employmentType?.replace('_', ' ') || "Full Time"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Status</p>
                  <Badge variant="outline" className="mt-1 capitalize text-green-600 border-green-200 bg-green-50">
                    {employee?.status || "Active"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Auth Level</p>
                  <p className="font-medium mt-1">Verified (MFA)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {employee && (
        <ProfileEditDialog
          employee={employee}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={handleProfileUpdateSuccess}
        />
      )}
    </div>
  );
}
