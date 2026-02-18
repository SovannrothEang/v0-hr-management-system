"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { User } from "@/stores/user-store";

interface UserTableProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  admin: { label: "Admin", variant: "destructive" },
  hr_manager: { label: "HR Manager", variant: "secondary" },
  employee: { label: "Employee", variant: "default" },
};

export function UserTable({
  users,
  onView,
  onEdit,
  onDelete,
}: UserTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { isAdmin } = usePermissions();

  const handleRowClick = (user: User) => {
    onView(user);
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
    if (selectedRows.size === users.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(users.map((u) => u.id)));
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const formatRole = (role: string) => {
    return roleConfig[role] || { label: role, variant: "outline" };
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30 hover:bg-secondary/30">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRows.size === users.length && users.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                className={cn(
                  "cursor-pointer",
                  selectedRows.has(user.id) && "bg-secondary/20"
                )}
                onClick={() => handleRowClick(user)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.has(user.id)}
                    onCheckedChange={() => toggleRow(user.id)}
                  />
                </TableCell>
                 <TableCell>
                   <div className="flex items-center gap-3">
                     <Avatar className="h-9 w-9">
                       <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.firstName} />
                       <AvatarFallback className="bg-primary/10 text-primary text-xs">
                         {getInitials(user.firstName, user.lastName)}
                       </AvatarFallback>
                     </Avatar>
                     <div>
                       <p className="font-medium text-card-foreground">
                         {user.firstName} {user.lastName}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         @{user.username || user.email.split('@')[0]}
                       </p>
                       <p className="text-xs text-muted-foreground">User ID: {user.id.slice(0, 8)}</p>
                     </div>
                   </div>
                 </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => {
                      const config = formatRole(role);
                      return (
                        <Badge
                          key={role}
                          variant={config.variant}
                          className="text-xs"
                        >
                          {config.label}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.isActive ? "default" : "outline"}
                    className={cn(
                      user.isActive && "bg-success/20 text-success hover:bg-success/30 border-0"
                    )}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
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
                      <DropdownMenuItem onClick={() => onView(user)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(user)}
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