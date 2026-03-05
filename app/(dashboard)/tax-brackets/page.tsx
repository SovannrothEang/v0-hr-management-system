"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTaxBrackets,
  useCreateTaxBracket,
  useDeleteTaxBracket,
  type CreateTaxBracketDto,
} from "@/hooks/use-tax-brackets";
import { useCurrencies } from "@/hooks/use-currencies";
import { Plus, Trash2, Percent, Calculator } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

const countries = [
  { code: "US", name: "United States" },
  { code: "KH", name: "Cambodia" },
  { code: "SG", name: "Singapore" },
  { code: "ID", name: "Indonesia" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
];

export default function TaxBracketsPage() {
  const { isAdmin, isHRManager } = usePermissions();
  const canManage = isAdmin || isHRManager;

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedCurrency, setSelectedCurrency] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("KH");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: taxBracketsData, isLoading: isLoadingBrackets } =
    useTaxBrackets({
      taxYear: parseInt(selectedYear),
      currencyCode: selectedCurrency === "all" ? undefined : selectedCurrency,
      countryCode: selectedCountry,
      limit: 100,
    });

  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();
  const createTaxBracket = useCreateTaxBracket();
  const deleteTaxBracket = useDeleteTaxBracket();

  const [newBracket, setNewBracket] = useState<CreateTaxBracketDto>({
    currencyCode: "",
    countryCode: "KH",
    taxYear: currentYear,
    bracketName: "",
    minAmount: 0,
    maxAmount: 0,
    taxRate: 0,
    fixedAmount: 0,
  });

  const handleAddBracket = () => {
    if (!newBracket.currencyCode || !newBracket.bracketName) {
      return;
    }
    createTaxBracket.mutate(newBracket, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewBracket({
          currencyCode: selectedCurrency === "all" ? "" : selectedCurrency,
          countryCode: selectedCountry,
          taxYear: parseInt(selectedYear),
          bracketName: "",
          minAmount: 0,
          maxAmount: 0,
          taxRate: 0,
          fixedAmount: 0,
        });
      },
    });
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Tax Brackets"
        description="Manage tax brackets for payroll calculations."
      />

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Filter Tax Brackets
          </CardTitle>
          <CardDescription>
            View tax brackets by year, currency, and country.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tax Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={selectedCurrency}
                onValueChange={setSelectedCurrency}
                disabled={isLoadingCurrencies}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All currencies</SelectItem>
                  {currencies?.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Brackets Table */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Tax Brackets
            </CardTitle>
            <CardDescription>
              {taxBracketsData?.data?.length || 0} tax bracket(s) found
            </CardDescription>
          </div>
          {canManage && (
            <Button
              onClick={() => {
                setNewBracket({
                  currencyCode:
                    selectedCurrency !== "all"
                      ? selectedCurrency
                      : (currencies?.[0]?.code ?? "USD"),
                  countryCode: selectedCountry,
                  taxYear: parseInt(selectedYear),
                  bracketName: "",
                  minAmount: 0,
                  maxAmount: 0,
                  taxRate: 0,
                  fixedAmount: 0,
                });
                setIsAddDialogOpen(true);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Bracket
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingBrackets ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : taxBracketsData?.data?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No tax brackets found</p>
              <p className="text-sm">
                No tax brackets configured for {selectedYear}.
                {canManage && " Click Add Tax Bracket to create one."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bracket Name</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Income Range</TableHead>
                  <TableHead>Tax Rate</TableHead>
                  <TableHead>Fixed Amount</TableHead>
                  {canManage && (
                    <TableHead className="w-[100px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxBracketsData?.data?.map((bracket) => (
                  <TableRow key={bracket.id}>
                    <TableCell className="font-medium">
                      {bracket.bracketName}
                    </TableCell>
                    <TableCell>{bracket.currencyCode}</TableCell>
                    <TableCell>
                      {formatCurrency(bracket.minAmount, bracket.currencyCode)}{" "}
                      -{" "}
                      {formatCurrency(bracket.maxAmount, bracket.currencyCode)}
                    </TableCell>
                    <TableCell>{formatPercent(bracket.taxRate)}</TableCell>
                    <TableCell>
                      {formatCurrency(
                        bracket.fixedAmount,
                        bracket.currencyCode,
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteTaxBracket.mutate(bracket.id)}
                          disabled={deleteTaxBracket.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Tax Bracket Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Tax Bracket</DialogTitle>
            <DialogDescription>
              Create a new tax bracket for payroll calculations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bracketName">Bracket Name *</Label>
                <Input
                  id="bracketName"
                  placeholder="e.g., Low Income"
                  value={newBracket.bracketName}
                  onChange={(e) =>
                    setNewBracket({
                      ...newBracket,
                      bracketName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxYear">Tax Year *</Label>
                <Select
                  value={newBracket.taxYear.toString()}
                  onValueChange={(v) =>
                    setNewBracket({ ...newBracket, taxYear: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currencyCode">Currency *</Label>
                <Select
                  value={newBracket.currencyCode}
                  onValueChange={(v) =>
                    setNewBracket({ ...newBracket, currencyCode: v })
                  }
                  disabled={isLoadingCurrencies}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies?.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryCode">Country *</Label>
                <Select
                  value={newBracket.countryCode}
                  onValueChange={(v) =>
                    setNewBracket({ ...newBracket, countryCode: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Min Income *</Label>
                <Input
                  id="minAmount"
                  type="number"
                  min={0}
                  value={newBracket.minAmount}
                  onChange={(e) =>
                    setNewBracket({
                      ...newBracket,
                      minAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Income *</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  min={0}
                  value={newBracket.maxAmount}
                  onChange={(e) =>
                    setNewBracket({
                      ...newBracket,
                      maxAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%) *</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={(newBracket.taxRate * 100).toFixed(2)}
                  onChange={(e) =>
                    setNewBracket({
                      ...newBracket,
                      taxRate: parseFloat(e.target.value) / 100 || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  e.g., 10 for 10%
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fixedAmount">Fixed Tax Amount</Label>
                <Input
                  id="fixedAmount"
                  type="number"
                  min={0}
                  value={newBracket.fixedAmount}
                  onChange={(e) =>
                    setNewBracket({
                      ...newBracket,
                      fixedAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Subtracted from tax (if any)
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBracket}
              disabled={
                createTaxBracket.isPending ||
                !newBracket.bracketName ||
                !newBracket.currencyCode
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createTaxBracket.isPending
                ? "Creating..."
                : "Create Tax Bracket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
