"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserTable } from "@/components/users/user-table";
import { UserFilters } from "@/components/users/user-filters";
import { UserDetailSheet } from "@/components/users/user-detail-sheet";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserSummaryCards } from "@/components/users/user-summary-cards";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminOnly } from "@/components/auth/protected-action";
import { useUsers, useDeleteUser, useUserSummary } from "@/hooks/use-users";
import { useUserStore, type User } from "@/stores/user-store";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const { searchQuery, filterRole } = useUserStore();

  // Use local state for pagination instead of URL parameters
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole]);

  const { data: result, isLoading, isFetching } = useUsers({
    search: searchQuery,
    role: filterRole !== "all" ? filterRole : undefined,
    page: currentPage,
    limit: limit,
  });

  const isInitialLoading = isLoading;
  const isBackgroundUpdating = isFetching && !isLoading;

  const { mutate: deleteUser } = useDeleteUser();
  const { data: summary } = useUserSummary();

  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const users = result?.data || [];
  const meta = result?.meta;

  const handleView = (user: User) => {
    setSelectedUserDetail(user);
    setDetailSheetOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormDialogOpen(true);
    setDetailSheetOpen(false);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setFormDialogOpen(true);
  };

  const updatePage = (newPage: number, newLimit?: number) => {
    setCurrentPage(newPage);
    if (newLimit !== undefined) {
      setLimit(newLimit);
    }
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
        title="Users"
        description="Manage system users and permissions"
      >
        <AdminOnly>
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </AdminOnly>
      </PageHeader>

      <UserSummaryCards
        totalUsers={summary?.totalUsers ?? 0}
        adminCount={summary?.adminCount ?? 0}
        hrCount={summary?.hrCount ?? 0}
        activeCount={summary?.activeCount ?? 0}
      />

      <UserFilters />

      {isInitialLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className={cn("relative", isBackgroundUpdating && "opacity-60 pointer-events-none")}>
          <UserTable
            users={users}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {isBackgroundUpdating && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Pagination and user count */}
      {meta && (
        <div className="flex items-center justify-end space-x-6 lg:space-x-8 mt-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Rows per page:</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => updatePage(1, parseInt(value))}
            >
              <SelectTrigger className="h-8 w-[70px] border-none shadow-none focus:ring-0">
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center text-sm font-medium text-muted-foreground">
            {meta.total > 0 ? (
              `${(meta.page - 1) * meta.limit + 1}-${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}`
            ) : (
              "0-0 of 0"
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handlePreviousPage}
              disabled={!meta.hasPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleNextPage}
              disabled={!meta.hasNext}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <UserDetailSheet
        user={selectedUserDetail}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={handleEdit}
      />

      {/* Form Dialog */}
      <UserFormDialog
        user={editingUser}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.firstName}{" "}
              {userToDelete?.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}