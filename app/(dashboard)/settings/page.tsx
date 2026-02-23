"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Bell, Shield, Globe, Palette, Loader2, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { usePermissions } from "@/hooks/use-permissions";

interface CompanySettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  baseCurrencyCode: string;
  fiscalYearStartMonth: number;
  timezone: string;
  dateFormat: string;
  workWeekStarts: string;
}

const TIMEZONES = [
  { value: "UTC-12", label: "UTC-12:00" },
  { value: "UTC-11", label: "UTC-11:00" },
  { value: "UTC-10", label: "UTC-10:00 (HST)" },
  { value: "UTC-9", label: "UTC-09:00 (AKST)" },
  { value: "UTC-8", label: "UTC-08:00 (PST)" },
  { value: "UTC-7", label: "UTC-07:00 (MST)" },
  { value: "UTC-6", label: "UTC-06:00 (CST)" },
  { value: "UTC-5", label: "UTC-05:00 (EST)" },
  { value: "UTC-4", label: "UTC-04:00 (AST)" },
  { value: "UTC-3", label: "UTC-03:00" },
  { value: "UTC", label: "UTC+00:00 (GMT)" },
  { value: "UTC+1", label: "UTC+01:00 (CET)" },
  { value: "UTC+2", label: "UTC+02:00" },
  { value: "UTC+3", label: "UTC+03:00" },
  { value: "UTC+4", label: "UTC+04:00" },
  { value: "UTC+5", label: "UTC+05:00" },
  { value: "UTC+6", label: "UTC+06:00" },
  { value: "UTC+7", label: "UTC+07:00" },
  { value: "UTC+8", label: "UTC+08:00" },
  { value: "UTC+9", label: "UTC+09:00 (JST)" },
  { value: "UTC+10", label: "UTC+10:00" },
  { value: "UTC+11", label: "UTC+11:00" },
  { value: "UTC+12", label: "UTC+12:00" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "IDR", label: "IDR (Rp)" },
  { value: "SGD", label: "SGB ($)" },
  { value: "AUD", label: "AUD ($)" },
  { value: "CAD", label: "CAD ($)" },
];

const DATE_FORMATS = [
  { value: "mdy", label: "MM/DD/YYYY" },
  { value: "dmy", label: "DD/MM/YYYY" },
  { value: "ymd", label: "YYYY-MM-DD" },
];

const WORK_WEEK_STARTS = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "saturday", label: "Saturday" },
];

const defaultSettings: CompanySettings = {
  id: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  baseCurrencyCode: "USD",
  fiscalYearStartMonth: 1,
  timezone: "UTC",
  dateFormat: "mdy",
  workWeekStarts: "monday",
};

export default function SettingsPage() {
  const { can } = usePermissions();
  const canModifySettings = can?.modifySettings ?? false;

  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<CompanySettings>("/settings/company");
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.put<CompanySettings>("/settings/company", {
        name: settings.name,
        email: settings.email || null,
        phone: settings.phone || null,
        address: settings.address || null,
        baseCurrencyCode: settings.baseCurrencyCode,
        fiscalYearStartMonth: settings.fiscalYearStartMonth,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        workWeekStarts: settings.workWeekStarts,
      });

      if (response.success) {
        toast.success("Settings saved successfully");
        if (response.data) {
          setSettings(response.data);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/auth/change-password", {
        oldPassword: currentPassword,
        newPassword: newPassword,
      });

      if (response.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSetting = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Settings"
        backHref="/profile"
        description="Manage your organization settings, preferences, and configurations."
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {isLoading ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Building2 className="h-5 w-5 text-primary" />
                    Organization Details
                  </CardTitle>
                  <CardDescription>
                    Update your organization information and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={settings.name}
                        onChange={(e) => updateSetting("name", e.target.value)}
                        className="bg-secondary border-border"
                        disabled={!canModifySettings}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={settings.email || ""}
                        onChange={(e) => updateSetting("email", e.target.value)}
                        className="bg-secondary border-border"
                        disabled={!canModifySettings}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={settings.phone || ""}
                        onChange={(e) => updateSetting("phone", e.target.value)}
                        className="bg-secondary border-border"
                        disabled={!canModifySettings}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={settings.address || ""}
                        onChange={(e) => updateSetting("address", e.target.value)}
                        className="bg-secondary border-border"
                        disabled={!canModifySettings}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Globe className="h-5 w-5 text-primary" />
                    Localization
                  </CardTitle>
                  <CardDescription>
                    Configure regional settings for your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) => updateSetting("timezone", value)}
                        disabled={!canModifySettings}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={settings.baseCurrencyCode}
                        onValueChange={(value) => updateSetting("baseCurrencyCode", value)}
                        disabled={!canModifySettings}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={settings.dateFormat}
                        onValueChange={(value) => updateSetting("dateFormat", value)}
                        disabled={!canModifySettings}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_FORMATS.map((df) => (
                            <SelectItem key={df.value} value={df.value}>
                              {df.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workWeek">Work Week Starts</Label>
                      <Select
                        value={settings.workWeekStarts}
                        onValueChange={(value) => updateSetting("workWeekStarts", value)}
                        disabled={!canModifySettings}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select work week start" />
                        </SelectTrigger>
                        <SelectContent>
                          {WORK_WEEK_STARTS.map((ww) => (
                            <SelectItem key={ww.value} value={ww.value}>
                              {ww.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {canModifySettings && (
                <div className="flex justify-end">
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Leave Request Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when employees submit leave requests
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Attendance Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for late arrivals and absences
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Payroll Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about upcoming payroll processing dates
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summary reports via email
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">Change Password</p>
                  <p className="text-sm text-muted-foreground">
                    Update your account password
                  </p>
                </div>
                <div className="grid gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        className="bg-secondary border-border pr-10"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        className="bg-secondary border-border pr-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className="bg-secondary border-border pr-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleChangePassword}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Palette className="h-5 w-5 text-primary" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Use smaller spacing and font sizes
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Sidebar Collapsed</p>
                  <p className="text-sm text-muted-foreground">
                    Start with sidebar in collapsed state
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Animations</p>
                  <p className="text-sm text-muted-foreground">
                    Enable interface animations and transitions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
