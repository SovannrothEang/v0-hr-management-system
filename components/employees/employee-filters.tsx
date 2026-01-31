"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useEmployeeStore, type EmploymentStatus } from "@/stores/employee-store";
import { useDepartments } from "@/hooks/use-departments";

export function EmployeeFilters() {
  const {
    searchQuery,
    filterDepartment,
    filterStatus,
    setSearchQuery,
    setFilterDepartment,
    setFilterStatus,
    clearFilters,
  } = useEmployeeStore();
  const { data: departments } = useDepartments();

  const hasFilters =
    searchQuery || filterDepartment !== "all" || filterStatus !== "all";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-input border-border"
        />
      </div>

      <Select value={filterDepartment} onValueChange={setFilterDepartment}>
        <SelectTrigger className="w-[180px] bg-input border-border">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments?.map((dept) => (
            <SelectItem key={dept.id} value={dept.name}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterStatus}
        onValueChange={(value) => setFilterStatus(value as EmploymentStatus | "all")}
      >
        <SelectTrigger className="w-[150px] bg-input border-border">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="on_leave">On Leave</SelectItem>
          <SelectItem value="probation">Probation</SelectItem>
          <SelectItem value="terminated">Terminated</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
