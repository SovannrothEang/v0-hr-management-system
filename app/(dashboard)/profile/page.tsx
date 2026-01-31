"use client";

import { useSessionStore } from "@/stores/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  ExternalLink,
  Clock,
  Calendar,
  Settings
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useSessionStore();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader 
        title="My Profile" 
        description="View and manage your account information"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Account Card */}
        <Card className="md:col-span-1 border-border bg-card">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4 ring-4 ring-primary/10">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(user.name || "User")}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {user.roles.map(role => (
                <Badge key={role} variant="secondary" className="capitalize">
                  <Shield className="h-3 w-3 mr-1" />
                  {role.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                className="w-full" 
                onClick={() => router.push("/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
              {user.employeeId && (
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/employees/${user.employeeId}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Record
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Activity / Stats */}
        <div className="md:col-span-2 space-y-6">
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
                <div className="text-2xl font-bold">January 2024</div>
                <p className="text-xs text-muted-foreground mt-1">2 years with HRFlow</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>Details about your current active session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Role</p>
                    <p className="font-medium capitalize">{user.roles[0].replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Auth Level</p>
                    <p className="font-medium">Verified (MFA)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">IP Address</p>
                    <p className="font-mono">192.168.1.45</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Session Expiry</p>
                    <p className="font-medium text-warning">In 4 hours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
