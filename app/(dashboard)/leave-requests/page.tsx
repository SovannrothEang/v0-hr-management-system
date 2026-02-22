"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveRequestTable } from "@/components/attendances/leave-request-table";
import { LeaveRequestForm } from "@/components/attendances/leave-request-form";
import { LeaveRequestDetailsDialog } from "@/components/attendances/leave-request-details-dialog";
import { useLeaveRequests, useUpdateLeaveRequest } from "@/hooks/use-attendance";
import { usePermissions } from "@/hooks/use-permissions";
import { Plus, ChevronLeft, ChevronRight, X, Search } from "lucide-react";
import type { LeaveRequest } from "@/stores/attendance-store";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";

const LEAVE_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "ANNUAL_LEAVE", label: "Annual Leave" },
  { value: "SICK_LEAVE", label: "Sick Leave" },
  { value: "PARENTAL_LEAVE", label: "Parental Leave" },
  { value: "BEREAVEMENT_LEAVE", label: "Bereavement Leave" },
  { value: "CASUAL_LEAVE", label: "Casual Leave" },
  { value: "UNPAID_LEAVE", label: "Unpaid Leave" },
  { value: "STUDY_LEAVE", label: "Study Leave" },
];

export default function LeaveRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const { isAdmin, isHRManager } = usePermissions();

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, leaveTypeFilter, debouncedSearch, dateFromFilter, dateToFilter]);

  const hasActiveFilters = 
    leaveTypeFilter !== "all" || 
    searchInput !== "" || 
    dateFromFilter !== "" || 
    dateToFilter !== "";

  const clearFilters = () => {
    setLeaveTypeFilter("all");
    setSearchInput("");
    setDateFromFilter("");
    setDateToFilter("");
  };

  const { data: result, isLoading } = useLeaveRequests({
    status: statusFilter,
    leaveType: leaveTypeFilter !== "all" ? leaveTypeFilter : undefined,
    search: debouncedSearch || undefined,
    dateFrom: dateFromFilter || undefined,
    dateTo: dateToFilter || undefined,
    page: currentPage,
    limit: limit,
  });
  const { mutate: updateRequest } = useUpdateLeaveRequest();

  const handleApprove = (id: string) => {
    updateRequest({
      id,
      status: "approved",
    });
  };

  const handleReject = (id: string) => {
    updateRequest({
      id,
      status: "rejected",
    });
  };

  const handleViewDetails = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const isManager = isAdmin || isHRManager;

  const requests = result?.data || [];
  const meta = result?.meta;
  const summary = result?.summary;

  const updatePage = (newPage: number) => {
    setCurrentPage(newPage);
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Leave Requests"
        description="Manage employee leave requests and approvals"
      >
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      </PageHeader>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-semibold">{summary.total_requests}</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/10">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold text-warning">{summary.pending_count}</p>
            </CardContent>
          </Card>
          <Card className="bg-success/10">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-semibold text-success">{summary.approved_count}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-semibold text-destructive">{summary.rejected_count}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Search Employee</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Code, name, username, email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchInput("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="min-w-[160px] space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px] space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            <div className="min-w-[140px] space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mb-0.5">
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {summary && summary.pending_count > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning text-warning-foreground text-xs font-medium">
                {summary.pending_count}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <LeaveRequestTable
                requests={requests || []}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDetails={handleViewDetails}
                showActions={isManager}
              />

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {meta.page * meta.limit - meta.limit + 1} to{" "}
                    {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} requests
                  </p>

                  <div className="flex items-center gap-2">
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
        </TabsContent>
      </Tabs>

      <LeaveRequestForm open={formOpen} onOpenChange={setFormOpen} />

      <LeaveRequestDetailsDialog
        request={selectedRequest}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        canManage={true}
      />
    </div>
  );
}
