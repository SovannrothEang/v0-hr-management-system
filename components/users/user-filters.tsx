"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { ROLES } from "@/lib/constants/roles";

export function UserFilters() {
  const {
    searchQuery,
    filterRole,
    setSearchQuery,
    setFilterRole,
    clearFilters,
  } = useUserStore();

  const hasFilters = searchQuery || filterRole !== "all";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-input border-border"
        />
      </div>

      <Select value={filterRole} onValueChange={setFilterRole}>
        <SelectTrigger className="w-[180px] bg-input border-border">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          {Object.entries(ROLES).map(([key, value]) => (
            <SelectItem key={value} value={value}>
              {key.replace('_', ' ').toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}