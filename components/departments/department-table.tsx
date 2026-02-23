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
import type { Department } from "@/hooks/use-departments";

interface DepartmentTableProps {
  departments: Department[];
  totalEmployees: number;
  onView: (department: Department) => void;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}

export function DepartmentTable({
  departments,
  totalEmployees,
  onView,
  onEdit,
  onDelete,
}: DepartmentTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { isAdmin } = usePermissions();

  const handleRowClick = (department: Department) => {
    onView(department);
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
    if (selectedRows.size === departments.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(departments.map((d) => d.id)));
    }
  };

  const calculatePercentage = (dept: Department) => {
    if (totalEmployees > 0 && dept.employeeCount) {
      return ((dept.employeeCount / totalEmployees) * 100).toFixed(1);
    }
    return "0";
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30 hover:bg-secondary/30">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRows.size === departments.length && departments.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Department Name</TableHead>
            <TableHead>Employees</TableHead>
            <TableHead>% of Workforce</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                No departments found.
              </TableCell>
            </TableRow>
          ) : (
            departments.map((department) => (
              <TableRow
                key={department.id}
                className={cn(
                  "cursor-pointer",
                  selectedRows.has(department.id) && "bg-secondary/20"
                )}
                onClick={() => handleRowClick(department)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.has(department.id)}
                    onCheckedChange={() => toggleRow(department.id)}
                  />
                </TableCell>
                <TableCell>
                  <p className="font-medium text-card-foreground">
                    {department.name}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {department.employeeCount || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {calculatePercentage(department)}%
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {department.createdAt
                    ? new Date(department.createdAt).toLocaleDateString("en-US", {
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
                      <DropdownMenuItem onClick={() => onView(department)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(department)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(department)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
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
