"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import type { Position } from "@/hooks/use-positions";

interface PositionTableProps {
  positions: Position[];
  onView: (position: Position) => void;
  onEdit: (position: Position) => void;
  onDelete: (position: Position) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PositionTable({
  positions,
  onView,
  onEdit,
  onDelete,
}: PositionTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { can } = usePermissions();

  const handleRowClick = (position: Position) => {
    onView(position);
  };

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === positions.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(positions.map((p) => p.id)));
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30 hover:bg-secondary/30">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRows.size === positions.length && positions.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Salary Range</TableHead>
            <TableHead>Employees</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                No positions found.
              </TableCell>
            </TableRow>
          ) : (
            positions.map((position) => (
              <TableRow
                key={position.id}
                className={cn(
                  "cursor-pointer",
                  selectedRows.has(position.id) && "bg-secondary/20"
                )}
                onClick={() => handleRowClick(position)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.has(position.id)}
                    onCheckedChange={() => toggleRow(position.id)}
                  />
                </TableCell>
                <TableCell>
                  <p className="font-medium text-card-foreground">
                    {position.title}
                  </p>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {position.description || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatCurrency(position.salaryRangeMin)} – {formatCurrency(position.salaryRangeMax)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {position.employeeCount}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={position.isActive ? "default" : "outline"}
                    className={cn(
                      position.isActive && "bg-success/20 text-success hover:bg-success/30 border-0"
                    )}
                  >
                    {position.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {position.createdAt
                    ? new Date(position.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView(position)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {(can.updatePosition || can.deletePosition) && (
                        <>
                          {can.updatePosition && (
                            <DropdownMenuItem onClick={() => onEdit(position)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {can.updatePosition && can.deletePosition && (
                            <DropdownMenuSeparator />
                          )}
                          {can.deletePosition && (
                            <DropdownMenuItem
                              onClick={() => onDelete(position)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
