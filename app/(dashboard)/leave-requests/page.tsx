"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveRequestTable } from "@/components/attendances/leave-request-table";
import { LeaveRequestForm } from "@/components/attendances/leave-request-form";
import { useLeaveRequests, useUpdateLeaveRequest } from "@/hooks/use-attendance";
import { useSessionStore } from "@/stores/session";
import { usePermissions } from "@/hooks/use-permissions";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

export default function LeaveRequestsPage() {
  const { user } = useSessionStore();
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const { isAdmin, isHRManager } = usePermissions();

  // Use local state for pagination instead of URL parameters
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Reset to page 1 when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const { data: result, isLoading } = useLeaveRequests({
    status: statusFilter,
    page: currentPage,
    limit: limit,
  });
  const { mutate: updateRequest } = useUpdateLeaveRequest();

  const handleApprove = (id: string) => {
    updateRequest({
      id,
      status: "approved",
      approverId: user?.id,
    });
  };

  const handleReject = (id: string) => {
    updateRequest({
      id,
      status: "rejected",
      approverId: user?.id,
    });
  };

  const isManager = isAdmin || isHRManager;

  const requests = result?.data || [];
  const meta = result?.meta;
  const pendingCount = requests.filter((r) => r.status === "pending").length || 0;

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

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning text-warning-foreground text-xs font-medium">
                {pendingCount}
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
    </div>
  );
}
