"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "@/hooks/use-departments";
import { usePermissions } from "@/hooks/use-permissions";
import { Building2, Users, Plus, Pencil, Trash2 } from "lucide-react";
import type { Department } from "@/hooks/use-departments";

export default function DepartmentsPage() {
  const { data: departments, isLoading } = useDepartments();
  const { mutate: createDepartment, isPending: isCreating } = useCreateDepartment();
  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment();
  const { mutate: deleteDepartment, isPending: isDeleting } = useDeleteDepartment();
  const { isAdmin } = usePermissions();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState("");

  const isPending = isCreating || isUpdating || isDeleting;

  const handleCreate = () => {
    if (!departmentName.trim()) return;
    createDepartment(
      { name: departmentName.trim() },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          setDepartmentName("");
        },
      }
    );
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name);
  };

  const handleUpdate = () => {
    if (!editingDepartment || !departmentName.trim()) return;
    updateDepartment(
      {
        id: editingDepartment.id,
        original: editingDepartment,
        modified: { name: departmentName.trim() },
      },
      {
        onSuccess: () => {
          setEditingDepartment(null);
          setDepartmentName("");
        },
      }
    );
  };

  const handleDelete = (department: Department) => {
    setDeletingDepartment(department);
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={isPending}>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Enter the name of the new department.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="departmentName">Department Name</Label>
                  <Input
                    id="departmentName"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="e.g., Engineering"
                    disabled={isPending}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isPending || !departmentName.trim()}>
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : departments && departments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept: Department) => (
            <Card key={dept.name} className="bg-card border-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-card-foreground">
                    {dept.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEdit(dept)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(dept)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{dept.employeeCount || 0} employees</span>
                </div>
                {dept.employeeCount !== undefined && dept.employeeCount > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    {dept.percentage || 0}% of workforce
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            No departments found
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDepartmentName">Department Name</Label>
              <Input
                id="editDepartmentName"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingDepartment(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isPending || !departmentName.trim()}>
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDepartment} onOpenChange={(open) => !open && setDeletingDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the department "{deletingDepartment?.name}".
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
