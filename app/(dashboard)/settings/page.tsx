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
import { Building2, Bell, Shield, Globe, Palette, Loader2, Eye, EyeOff, Save, DollarSign, Plus, Trash2, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrencies } from "@/hooks/use-currencies";
import { useExchangeRates, useSaveExchangeRate } from "@/hooks/use-exchange-rates";

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
  const { data: currencies = [], isLoading: currenciesLoading } = useCurrencies();
  const { data: exchangeRates = [], isLoading: ratesLoading } = useExchangeRates();
  const saveRateMutation = useSaveExchangeRate();
  const queryClient = useQueryClient();

  // Currency management state
  const [isAddCurrencyOpen, setIsAddCurrencyOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState({
    code: "",
    name: "",
    symbol: "",
    country: "",
  });

  // Exchange rate management state
  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [newRate, setNewRate] = useState({
    fromCurrencyCode: "USD",
    toCurrencyCode: "KHR",
    rate: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
    // Force refetch currencies to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["currencies"] });
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

  // Currency mutations
  const addCurrencyMutation = useMutation({
    mutationFn: async (currency: typeof newCurrency) => {
      const response = await apiClient.post("/currencies", currency);
      if (!response.success) {
        throw new Error(response.message || "Failed to add currency");
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Currency added successfully");
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      setIsAddCurrencyOpen(false);
      setNewCurrency({ code: "", name: "", symbol: "", country: "" });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add currency");
    },
  });

  const deleteCurrencyMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiClient.delete(`/currencies/${code}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Currency deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete currency");
    },
  });

  const handleAddCurrency = () => {
    if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Check if currency already exists in the list
    const exists = currencies.find(c => c.code === newCurrency.code.toUpperCase());
    if (exists) {
      toast.error(`Currency ${newCurrency.code.toUpperCase()} already exists`);
      setIsAddCurrencyOpen(false);
      setNewCurrency({ code: "", name: "", symbol: "", country: "" });
      return;
    }
    
    addCurrencyMutation.mutate(newCurrency);
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
          <TabsTrigger value="finance">Finance</TabsTrigger>
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
                        disabled={!canModifySettings || currenciesLoading || currencies.length === 0}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder={currencies.length === 0 ? "No currencies available" : "Select currency"} />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.code} ({c.symbol}) - {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {currencies.length === 0 && !currenciesLoading && (
                        <p className="text-xs text-warning">
                          No currencies configured. Please add currencies in the Finance tab first.
                        </p>
                      )}
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

        <TabsContent value="finance" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Currencies
                  </CardTitle>
                  <CardDescription>
                    Manage currencies for payroll and company settings.
                  </CardDescription>
                </div>
                {canModifySettings && (
                  <Button
                    onClick={() => setIsAddCurrencyOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Currency
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {currenciesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : currencies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No currencies configured</p>
                  <p className="text-sm">Add a currency to use in payroll and company settings.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currencies.map((currency) => (
                    <div
                      key={currency.code}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{currency.symbol}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {currency.code} - {currency.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{currency.country}</p>
                        </div>
                      </div>
                      {canModifySettings && currency.code !== settings.baseCurrencyCode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteCurrencyMutation.mutate(currency.code)}
                          disabled={deleteCurrencyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    Exchange Rates
                  </CardTitle>
                  <CardDescription>
                    Configure exchange rates for multi-currency payroll.
                  </CardDescription>
                </div>
                {canModifySettings && (
                  <Button
                    onClick={() => setIsAddRateOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Set Rate
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {ratesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : exchangeRates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No exchange rates configured</p>
                  <p className="text-sm">Set an exchange rate to handle payroll in different currencies.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 px-4 text-sm font-medium text-muted-foreground">From</th>
                        <th className="py-3 px-4 text-sm font-medium text-muted-foreground">To</th>
                        <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Rate</th>
                        <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Effective Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchangeRates.map((rate) => (
                        <tr key={rate.id} className="border-b border-border hover:bg-secondary/50">
                          <td className="py-3 px-4">{rate.fromCurrencyCode}</td>
                          <td className="py-3 px-4">{rate.toCurrencyCode}</td>
                          <td className="py-3 px-4 font-medium">{Number(rate.rate).toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(rate.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Exchange Rate Dialog */}
          {isAddRateOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle>Set Exchange Rate</CardTitle>
                  <CardDescription>
                    Configure currency conversion rate for a specific date.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromCurrency">From</Label>
                      <Select
                        value={newRate.fromCurrencyCode}
                        onValueChange={(v) => setNewRate({ ...newRate, fromCurrencyCode: v })}
                      >
                        <SelectTrigger id="fromCurrency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toCurrency">To</Label>
                      <Select
                        value={newRate.toCurrencyCode}
                        onValueChange={(v) => setNewRate({ ...newRate, toCurrencyCode: v })}
                      >
                        <SelectTrigger id="toCurrency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate">Rate (1 {newRate.fromCurrencyCode} = ? {newRate.toCurrencyCode})</Label>
                    <Input
                      id="rate"
                      type="number"
                      placeholder="e.g., 4000"
                      value={newRate.rate}
                      onChange={(e) => setNewRate({ ...newRate, rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={newRate.date}
                      onChange={(e) => setNewRate({ ...newRate, date: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardContent className="flex justify-end gap-2 pt-0">
                  <Button variant="outline" onClick={() => setIsAddRateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (newRate.rate <= 0) {
                        toast.error("Rate must be greater than 0");
                        return;
                      }
                      if (newRate.fromCurrencyCode === newRate.toCurrencyCode) {
                        toast.error("Currencies must be different");
                        return;
                      }
                      saveRateMutation.mutate(newRate, {
                        onSuccess: () => setIsAddRateOpen(false)
                      });
                    }}
                    disabled={saveRateMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {saveRateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Rate
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add Currency Dialog */}
          {isAddCurrencyOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle>Add New Currency</CardTitle>
                  <CardDescription>
                    Add a new currency to the system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currencyCode">Currency Code *</Label>
                    <Input
                      id="currencyCode"
                      placeholder="USD"
                      required
                      value={newCurrency.code}
                      onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                      maxLength={3}
                    />
                    <p className="text-xs text-muted-foreground">3-letter ISO code (e.g., USD, EUR)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currencyName">Currency Name *</Label>
                    <Input
                      id="currencyName"
                      placeholder="US Dollar"
                      value={newCurrency.name}
                      required
                      onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currencySymbol">Symbol *</Label>
                    <Input
                      id="currencySymbol"
                      placeholder="$"
                      value={newCurrency.symbol}
                      required
                      onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currencyCountry">Country *</Label>
                    <Input
                      id="currencyCountry"
                      placeholder="United States"
                      value={newCurrency.country}
                      required
                      onChange={(e) => setNewCurrency({ ...newCurrency, country: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardContent className="flex justify-end gap-2 pt-0">
                  <Button variant="outline" onClick={() => setIsAddCurrencyOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddCurrency}
                    disabled={addCurrencyMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {addCurrencyMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Currency
                  </Button>
                </CardContent>
              </Card>
            </div>
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
