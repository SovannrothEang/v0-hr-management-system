"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeeDetailSheet } from "@/components/employees/employee-detail-sheet";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { useDebounce } from "@/hooks/use-debounce";
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
import { AdminOrHROnly } from "@/components/auth/protected-action";
import { useEmployees, useDeleteEmployee } from "@/hooks/use-employees";
import { useEmployeeStore, type Employee } from "@/stores/employee-store";
import { Plus, Download, Upload, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployeesPage() {
  const { searchQuery, filterDepartment, filterStatus } =
    useEmployeeStore();

  // Debounce the search query to avoid excessive API calls on every keystroke
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Use local state for pagination instead of URL parameters
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Reset to page 1 when debounced search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterDepartment, filterStatus]);

  const { data: result, isLoading, isFetching } = useEmployees({
    search: debouncedSearch,
    department: filterDepartment,
    status: filterStatus,
    page: currentPage,
    limit: limit,
  });

  const isInitialLoading = isLoading;
  const isBackgroundUpdating = isFetching && !isLoading;

  const { mutate: deleteEmployee } = useDeleteEmployee();

  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const employees = result?.data || [];
  const meta = result?.meta;

  const handleView = (employee: Employee) => {
    setSelectedEmployeeDetail(employee);
    setDetailSheetOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormDialogOpen(true);
    setDetailSheetOpen(false);
  };

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete.id);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
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
        title="Employees"
        description="Manage your organization's workforce"
      >
        <AdminOrHROnly>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </AdminOrHROnly>
      </PageHeader>

      <EmployeeFilters />

      {isInitialLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className={cn("relative", isBackgroundUpdating && "opacity-60 pointer-events-none")}>
          <EmployeeTable
            employees={employees}
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

      {/* Pagination and employee count */}
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
      <EmployeeDetailSheet
        employee={selectedEmployeeDetail}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={handleEdit}
      />

      {/* Form Dialog */}
      <EmployeeFormDialog
        employee={editingEmployee}
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {employeeToDelete?.firstName}{" "}
              {employeeToDelete?.lastName}? This action cannot be undone.
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
