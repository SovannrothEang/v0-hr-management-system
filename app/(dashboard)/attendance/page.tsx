"use client";

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
  const { selectedDate, setSelectedDate } = useAttendanceStore();
  const { data: records, isLoading: recordsLoading } = useAttendanceRecords({
    date: format(selectedDate, "yyyy-MM-dd"),
  });
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { mutate: clockIn } = useClockIn();
  const { mutate: clockOut } = useClockOut();

  const isLoading = recordsLoading || employeesLoading;

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

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
          {records?.length || 0} employee{(records?.length || 0) !== 1 ? "s" : ""}
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
        <AttendanceTable
          records={records || []}
          employees={employees || []}
          onClockIn={(employeeId) => clockIn(employeeId)}
          onClockOut={(employeeId) => clockOut(employeeId)}
        />
      )}
    </div>
  );
}
