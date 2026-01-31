"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Filter } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useDepartments } from "@/hooks/use-departments";

interface ReportFiltersProps {
  startDate: Date;
  endDate: Date;
  department: string;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onDepartmentChange: (department: string) => void;
}

export function ReportFilters({
  startDate,
  endDate,
  department,
  onStartDateChange,
  onEndDateChange,
  onDepartmentChange,
}: ReportFiltersProps) {
  const { data: departments } = useDepartments();

  const setQuickRange = (range: string) => {
    const today = new Date();
    let start = today;

    switch (range) {
      case "7days":
        start = subDays(today, 7);
        break;
      case "30days":
        start = subDays(today, 30);
        break;
      case "3months":
        start = subMonths(today, 3);
        break;
      case "6months":
        start = subMonths(today, 6);
        break;
      case "1year":
        start = subMonths(today, 12);
        break;
    }

    onStartDateChange(start);
    onEndDateChange(today);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-foreground">Report Filters</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-input border-border",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && onStartDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-input border-border",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(endDate, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && onEndDateChange(date)}
                disabled={(date) => date < startDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={department} onValueChange={onDepartmentChange}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments && departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quick Range</Label>
          <Select onValueChange={setQuickRange}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
