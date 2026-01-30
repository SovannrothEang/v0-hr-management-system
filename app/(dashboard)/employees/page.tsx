"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeeDetailSheet } from "@/components/employees/employee-detail-sheet";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
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
import { AdminOrHROnly } from "@/components/auth/protected-action";
import { useEmployees, useDeleteEmployee } from "@/hooks/use-employees";
import { useEmployeeStore, type Employee } from "@/stores/employee-store";
import { Plus, Download, Upload } from "lucide-react";

export default function EmployeesPage() {
  const { searchQuery, filterDepartment, filterStatus, setSelectedEmployee } =
    useEmployeeStore();
  const { data: employees, isLoading } = useEmployees({
    search: searchQuery,
    department: filterDepartment,
    status: filterStatus,
  });
  const { mutate: deleteEmployee } = useDeleteEmployee();

  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

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

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <EmployeeTable
          employees={employees || []}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Employee count */}
      {employees && (
        <p className="text-sm text-muted-foreground">
          Showing {employees.length} employee{employees.length !== 1 ? "s" : ""}
        </p>
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
