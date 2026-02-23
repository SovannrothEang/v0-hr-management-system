"use client";

import { useState, useCallback } from "react";

interface DepartmentFiltersState {
  searchQuery: string;
  sortBy: "name" | "createdAt" | "employeeCount";
  sortOrder: "asc" | "desc";
}

interface UseDepartmentFiltersReturn extends DepartmentFiltersState {
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: "name" | "createdAt" | "employeeCount") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  clearFilters: () => void;
}

export function useDepartmentFilters(): UseDepartmentFiltersReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "employeeCount">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSortBy("name");
    setSortOrder("asc");
  }, []);

  return {
    searchQuery,
    sortBy,
    sortOrder,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    clearFilters,
  };
}
