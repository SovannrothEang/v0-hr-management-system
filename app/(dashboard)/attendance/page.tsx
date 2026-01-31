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
import { format, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedDate, setSelectedDate } = useAttendanceStore();
  
  // Get page from URL query parameter, default to 1
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  
  const { data: result, isLoading: recordsLoading } = useAttendanceRecords({
    date: format(selectedDate, "yyyy-MM-dd"),
    page: currentPage,
    limit: limit,
  });
  const { data: employeesResult, isLoading: employeesLoading } = useEmployees();
  const { mutate: clockIn } = useClockIn();
  const { mutate: clockOut } = useClockOut();

  const isLoading = recordsLoading || employeesLoading;
  const records = result?.data || [];
  const meta = result?.meta;
  const employees = employeesResult?.data || [];

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    if (limit !== 10) params.set("limit", limit.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handlePreviousPage = () => {
    if (meta?.hasPrevious) {
      updatePage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (meta?.hasNext) {
      updatePage(currentPage + 1);
    }
  };

  const isToday =
    format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Attendance"
        description="Track daily attendance and work hours"
      >
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </PageHeader>

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isToday && (
            <Button variant="ghost" size="sm" onClick={handleToday}>
              Today
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {meta ? `${meta.total} employee${meta.total !== 1 ? "s" : ""}` : 
            `${records.length} employee${records.length !== 1 ? "s" : ""}`}
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
        <AttendanceOverview records={records || []} />
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
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
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
        </>
      )}
    </div>
  );
}
