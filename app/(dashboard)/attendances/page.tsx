"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceOverview } from "@/components/attendances/attendance-overview";
import { AttendanceTable } from "@/components/attendances/attendance-table";
import { useAttendanceRecords, useClockIn, useClockOut } from "@/hooks/use-attendance";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendanceStore } from "@/stores/attendance-store";
import { CalendarIcon, Download, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useAttendanceStore();

  // Local state for pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  
  // Use debounce for search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchInput, 500);

  const { data: result, isLoading: recordsLoading } = useAttendanceRecords({
    dateFrom: format(dateFrom, "yyyy-MM-dd"),
    dateTo: format(dateTo, "yyyy-MM-dd"),
    status: statusFilter,
    search: debouncedSearch,
    page: currentPage,
    limit: limit,
  });
  const { data: employeesResult, isLoading: employeesLoading } = useEmployees();
  const { mutate: clockIn } = useClockIn();
  const { mutate: clockOut } = useClockOut();

  const isLoading = recordsLoading || employeesLoading;
  const records = result?.data || [];
  const meta = result?.meta;
  const summary = result?.summary;
  const employees = employeesResult?.data || [];

  const handleResetFilters = () => {
    setDateFrom(subDays(new Date(), 1));
    setDateTo(new Date());
    setStatusFilter("all");
    setSearchInput("");
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (meta?.hasPrevious) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (meta?.hasNext) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-4">
      <PageHeader
        title="Attendance"
        description="Track daily attendance and work hours"
      >
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </PageHeader>

      {/* Filters Row */}
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee or ID..."
              className="pl-9 bg-background"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchInput && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearchInput("");
                  setCurrentPage(1);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select 
            value={statusFilter} 
            onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="early_out">Early Out</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Group */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[160px] justify-start text-left font-normal bg-background",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    if (date) {
                      setDateFrom(date);
                      setCurrentPage(1);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground">to</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[160px] justify-start text-left font-normal bg-background",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    if (date) {
                      setDateTo(date);
                      setCurrentPage(1);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>

        <div className="text-xs text-muted-foreground px-1 flex justify-between">
          <span>
            Viewing: <span className="text-foreground font-medium">{format(dateFrom, "PPP")}</span> 
            {isSameDay(dateFrom, dateTo) ? "" : ` to ${format(dateTo, "PPP")}`}
          </span>
          {meta && (
            <span>Found <b>{meta.total}</b> records</span>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <AttendanceOverview records={records || []} summary={summary} />
      )}

      {/* Attendance Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <>
          <AttendanceTable
            records={records}
            employees={employees || []}
            onClockIn={(employeeId) => clockIn(employeeId)}
            onClockOut={(employeeId) => clockOut(employeeId)}
            showDate={!isSameDay(dateFrom, dateTo)}
          />

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground mt-4">
              <div>
                Showing {records.length} of {meta.total} records
              </div>
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!meta.hasPrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!meta.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
