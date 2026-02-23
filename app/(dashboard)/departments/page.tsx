"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import { DepartmentTable } from "@/components/departments/department-table";
import { DepartmentFormDialog } from "@/components/departments/department-form-dialog";
import { DepartmentDetailSheet } from "@/components/departments/department-detail-sheet";
import { DepartmentSummaryCards } from "@/components/departments/department-summary-cards";
import { DepartmentFilters } from "@/components/departments/department-filters";
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useDepartmentSummary } from "@/hooks/use-departments";
import { useEmployees } from "@/hooks/use-employees";
import { usePermissions } from "@/hooks/use-permissions";
import { useDepartmentFilters } from "@/hooks/use-department-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Department } from "@/hooks/use-departments";

export default function DepartmentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { searchQuery, sortBy, sortOrder } = useDepartmentFilters();
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: deptResult, isLoading: isDeptsLoading, isFetching } = useDepartments({
    page: currentPage,
    limit,
    name: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  });
  const { data: empResult, isLoading: isEmployeesLoading } = useEmployees();
  const { data: summary } = useDepartmentSummary();
  const { mutate: createDepartment, isPending: isCreating } = useCreateDepartment();
  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment();
  const { mutate: deleteDepartment, isPending: isDeleting } = useDeleteDepartment();
  const { isAdmin } = usePermissions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  const isInitialLoading = isDeptsLoading || isEmployeesLoading;
  const isBackgroundUpdating = isFetching && !isDeptsLoading;
  const isPending = isCreating || isUpdating || isDeleting;

  const departments = deptResult?.data || [];
  const meta = deptResult?.meta;
  const employees = empResult?.data || [];
  const totalEmployeesCount = empResult?.meta?.total || employees.length || 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sortBy, sortOrder]);

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

  const handleCreate = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const handleView = (department: Department) => {
    setViewingDepartment(department);
  };

  const handleEdit = (department: Department) => {
    setViewingDepartment(null);
    setEditingDepartment(department);
    setIsFormOpen(true);
  };

  const handleDelete = (department: Department) => {
    setDeletingDepartment(department);
  };

  const handleFormSubmit = (data: { name: string }) => {
    if (editingDepartment) {
      updateDepartment(
        {
          id: editingDepartment.id,
          original: editingDepartment,
          modified: data,
        },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingDepartment(null);
          },
        }
      );
    } else {
      createDepartment(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const confirmDelete = () => {
    if (deletingDepartment) {
      deleteDepartment(deletingDepartment.id, {
        onSuccess: () => {
          setDeletingDepartment(null);
        },
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Departments"
        description="Manage your organization's departments"
      >
        {isAdmin && (
          <Button size="sm" onClick={handleCreate} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        )}
      </PageHeader>

      <DepartmentSummaryCards
        totalDepartments={summary?.totalDepartments ?? 0}
        totalEmployees={summary?.totalEmployees ?? 0}
        avgEmployeesPerDept={summary?.avgEmployeesPerDept ?? 0}
        largestDept={summary?.largestDept ?? ""}
      />

      <DepartmentFilters />

      {isInitialLoading ? (
        <div className="border border-border rounded-lg p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className={cn("relative", isBackgroundUpdating && "opacity-60 pointer-events-none")}>
          <DepartmentTable
            departments={departments}
            totalEmployees={totalEmployeesCount}
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

      {meta && (
        <div className="flex items-center justify-end space-x-6 lg:space-x-8 mt-6 border-t pt-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Rows per page:
            </span>
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
              `${(meta.page - 1) * meta.limit + 1}–${Math.min(
                meta.page * meta.limit,
                meta.total
              )} of ${meta.total}`
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

      <DepartmentFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingDepartment(null);
        }}
        department={editingDepartment}
        onSubmit={handleFormSubmit}
        isPending={isCreating || isUpdating}
      />

      <DepartmentDetailSheet
        department={viewingDepartment}
        totalEmployees={totalEmployeesCount}
        open={!!viewingDepartment}
        onOpenChange={(open) => {
          if (!open) setViewingDepartment(null);
        }}
        onEdit={handleEdit}
      />

      <AlertDialog
        open={!!deletingDepartment}
        onOpenChange={(open) => {
          if (!open) setDeletingDepartment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the department &quot;{deletingDepartment?.name}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
