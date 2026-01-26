"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveRequestTable } from "@/components/attendance/leave-request-table";
import { LeaveRequestForm } from "@/components/attendance/leave-request-form";
import { useLeaveRequests, useUpdateLeaveRequest } from "@/hooks/use-attendance";
import { useSessionStore } from "@/stores/session";
import { usePermissions } from "@/hooks/use-permissions";
import { Plus } from "lucide-react";

export default function LeaveRequestsPage() {
  const { user } = useSessionStore();
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const { isAdmin, isHRManager } = usePermissions();

  const { data: requests, isLoading } = useLeaveRequests({
    status: statusFilter,
  });
  const { mutate: updateRequest } = useUpdateLeaveRequest();

  const handleApprove = (id: string) => {
    updateRequest({
      id,
      status: "approved",
      approvedBy: user?.name || "Admin",
    });
  };

  const handleReject = (id: string) => {
    updateRequest({
      id,
      status: "rejected",
      approvedBy: user?.name || "Admin",
    });
  };

  const isManager = isAdmin || isHRManager;

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;

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
            <LeaveRequestTable
              requests={requests || []}
              onApprove={handleApprove}
              onReject={handleReject}
              showActions={isManager}
            />
          )}
        </TabsContent>
      </Tabs>

      {requests && (
        <p className="text-sm text-muted-foreground">
          Showing {requests.length} request{requests.length !== 1 ? "s" : ""}
        </p>
      )}

      <LeaveRequestForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
