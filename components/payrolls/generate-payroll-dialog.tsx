"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeneratePayroll } from "@/hooks/use-payroll";
import { Loader2, AlertCircle } from "lucide-react";

interface GeneratePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const months = [
  { name: "January", value: 1 },
  { name: "February", value: 2 },
  { name: "March", value: 3 },
  { name: "April", value: 4 },
  { name: "May", value: 5 },
  { name: "June", value: 6 },
  { name: "July", value: 7 },
  { name: "August", value: 8 },
  { name: "September", value: 9 },
  { name: "October", value: 10 },
  { name: "November", value: 11 },
  { name: "December", value: 12 },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const years = [currentYear - 1, currentYear, currentYear + 1];

function getPayPeriod(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    payPeriodStart: `${year}-${pad(month)}-01`,
    payPeriodEnd: `${year}-${pad(month)}-${pad(endDate.getDate())}`,
  };
}

export function GeneratePayrollDialog({
  open,
  onOpenChange,
}: GeneratePayrollDialogProps) {
  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const generatePayroll = useGeneratePayroll();

  const handleGenerate = async () => {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const { payPeriodStart, payPeriodEnd } = getPayPeriod(monthNum, yearNum);

    await generatePayroll.mutateAsync({
      payPeriodStart,
      payPeriodEnd,
      currencyCode: "USD",
    });
    onOpenChange(false);
  };

  const selectedMonthName = months.find((m) => m.value === parseInt(month))?.name || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Payroll</DialogTitle>
          <DialogDescription>
            Generate payroll records for all active employees for the selected
            period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Important</p>
              <p className="text-muted-foreground mt-1">
                This will create payroll records for {selectedMonthName} {year}{" "}
                based on employee salaries. Existing payroll records for this
                period will be skipped.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generatePayroll.isPending}>
            {generatePayroll.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Generate Payroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
