"use client";

import { PageHeader } from "@/components/page-header";
import { LeaveBalanceManagement } from "@/components/leave-balances/leave-balance-management";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function LeaveBalancesPage() {
  const { isAdmin, isHRManager } = usePermissions();

  const isManager = isAdmin || isHRManager;

  if (!isManager) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Leave Balances"
          description="Manage employee leave balances"
        />
        <Card className="border-destructive">
          <CardHeader className="flex flex-row items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              You do not have permission to view this page. This page is only accessible to Administrators and HR Managers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Leave Balances"
        description="Manage employee leave balances for different leave types and years"
      />

      <LeaveBalanceManagement />
    </div>
  );
}
