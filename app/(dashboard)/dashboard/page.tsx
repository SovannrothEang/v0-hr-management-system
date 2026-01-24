"use client";

import { PageHeader } from "@/components/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { DepartmentChart } from "@/components/dashboard/department-chart";
import { RecentActivityList } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDashboardStats,
  useAttendanceTrend,
  useDepartmentDistribution,
  useRecentActivity,
} from "@/hooks/use-dashboard";
import { useAuthStore } from "@/stores/auth-store";
import {
  Users,
  UserCheck,
  CalendarOff,
  FileQuestion,
  TrendingUp,
  Clock,
} from "lucide-react";

function StatsCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <Skeleton className="h-5 w-40 mb-4" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: attendanceTrend, isLoading: trendLoading } = useAttendanceTrend();
  const { data: departmentDist, isLoading: deptLoading } = useDepartmentDistribution();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(" ")[0] || "User"}`}
        description="Here's what's happening with your team today."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatsCard
              title="Total Employees"
              value={stats.totalEmployees}
              description="Active workforce"
              icon={Users}
              trend={{ value: 8.2, isPositive: true }}
            />
            <StatsCard
              title="Present Today"
              value={stats.presentToday}
              description={`${stats.attendanceRate}% attendance rate`}
              icon={UserCheck}
            />
            <StatsCard
              title="On Leave"
              value={stats.onLeave}
              description="Approved leaves today"
              icon={CalendarOff}
            />
            <StatsCard
              title="Pending Requests"
              value={stats.pendingLeaveRequests}
              description="Leave requests awaiting approval"
              icon={FileQuestion}
            />
          </>
        ) : null}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatsCard
              title="Average Work Hours"
              value={`${stats.averageWorkHours}h`}
              description="Per day this week"
              icon={Clock}
            />
            <StatsCard
              title="New Hires"
              value={stats.newHiresThisMonth}
              description="This month"
              icon={TrendingUp}
              trend={{ value: 12.5, isPositive: true }}
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {trendLoading ? (
          <ChartSkeleton />
        ) : attendanceTrend ? (
          <AttendanceChart data={attendanceTrend} />
        ) : null}

        {deptLoading ? (
          <ChartSkeleton />
        ) : departmentDist ? (
          <DepartmentChart data={departmentDist} />
        ) : null}
      </div>

      {/* Activity and Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {activitiesLoading ? (
          <ChartSkeleton />
        ) : activities ? (
          <RecentActivityList activities={activities} />
        ) : null}

        <QuickActions />
      </div>
    </div>
  );
}
