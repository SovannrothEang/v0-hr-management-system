"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceOverview } from "@/components/attendance/attendance-overview";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { useAttendanceRecords, useClockIn, useClockOut } from "@/hooks/use-attendance";
import { useEmployees } from "@/hooks/use-employees";
import { useAttendanceStore } from "@/stores/attendance-store";
import { CalendarIcon, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useAttendanceStore();

  // Local state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: result, isLoading: recordsLoading } = useAttendanceRecords({
    dateFrom: format(dateFrom, "yyyy-MM-dd"),
    dateTo: format(dateTo, "yyyy-MM-dd"),
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

  const handleResetDates = () => {
    setDateFrom(startOfMonth(new Date()));
    setDateTo(new Date());
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

      {/* Date Range Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[160px] justify-start text-left font-normal",
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

          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[160px] justify-start text-left font-normal",
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

          <Button variant="ghost" size="sm" onClick={handleResetDates}>
            Reset
          </Button>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="text-sm text-muted-foreground">
        Showing attendance from <span className="font-medium text-foreground">{format(dateFrom, "MMM d, yyyy")}</span> to <span className="font-medium text-foreground">{format(dateTo, "MMM d, yyyy")}</span>
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
            records={records || []}
            employees={employees || []}
            onClockIn={(employeeId) => clockIn(employeeId)}
            onClockOut={(employeeId) => clockOut(employeeId)}
          />

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>
              {meta ? `Total ${meta.total} records` : `Total ${records.length} records`}
            </div>

            {meta && meta.totalPages > 1 && (
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
