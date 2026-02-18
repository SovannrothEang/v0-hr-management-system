"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PositionTable } from "@/components/positions/position-table";
import { PositionFormDialog } from "@/components/positions/position-form-dialog";
import { PositionDetailSheet } from "@/components/positions/position-detail-sheet";
import {
  usePositions,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
} from "@/hooks/use-positions";
import { usePermissions } from "@/hooks/use-permissions";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Position, CreatePositionData } from "@/hooks/use-positions";

export default function PositionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: posResult, isLoading } = usePositions({
    search: debouncedSearch || undefined,
    page: currentPage,
    limit,
  });
  const { mutate: createPosition, isPending: isCreating } = useCreatePosition();
  const { mutate: updatePosition, isPending: isUpdating } = useUpdatePosition();
  const { mutate: deletePosition, isPending: isDeleting } = useDeletePosition();
  const { can } = usePermissions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [viewingPosition, setViewingPosition] = useState<Position | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);

  const isPending = isCreating || isUpdating || isDeleting;
  const positions = posResult?.data || [];
  const meta = posResult?.meta;

  // Simple debounce for search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    // Use a timeout to debounce search requests
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
    return () => clearTimeout(timeout);
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

  const handleCreate = () => {
    setEditingPosition(null);
    setIsFormOpen(true);
  };

  const handleView = (position: Position) => {
    setViewingPosition(position);
  };

  const handleEdit = (position: Position) => {
    setViewingPosition(null);
    setEditingPosition(position);
    setIsFormOpen(true);
  };

  const handleDelete = (position: Position) => {
    setDeletingPosition(position);
  };

  const handleFormSubmit = (data: CreatePositionData) => {
    if (editingPosition) {
      updatePosition(
        {
          id: editingPosition.id,
          original: editingPosition,
          modified: data,
        },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingPosition(null);
          },
        }
      );
    } else {
      createPosition(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const confirmDelete = () => {
    if (deletingPosition) {
      deletePosition(deletingPosition.id, {
        onSuccess: () => {
          setDeletingPosition(null);
        },
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Employee Positions"
        description="Manage job positions and salary ranges"
      >
        {can.createPosition && (
          <Button size="sm" onClick={handleCreate} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Add Position
          </Button>
        )}
      </PageHeader>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search positions..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="border border-border rounded-lg p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <PositionTable
          positions={positions}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
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

      {/* Form Dialog (Create / Edit) */}
      <PositionFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPosition(null);
        }}
        position={editingPosition}
        onSubmit={handleFormSubmit}
        isPending={isCreating || isUpdating}
      />

      {/* Detail Sheet */}
      <PositionDetailSheet
        position={viewingPosition}
        open={!!viewingPosition}
        onOpenChange={(open) => {
          if (!open) setViewingPosition(null);
        }}
        onEdit={handleEdit}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingPosition}
        onOpenChange={(open) => {
          if (!open) setDeletingPosition(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the position &quot;{deletingPosition?.title}&quot;.
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
