"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAccessToken } from "@/stores/session";

export type ExportFormat = "xlsx" | "csv";

interface ExportDropdownProps {
  endpoint: string;
  params?: Record<string, string>;
  disabled?: boolean;
  reportName?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export function ExportDropdown({
  endpoint,
  params = {},
  disabled = false,
  reportName = "report",
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams(params);
      queryParams.set("format", format);

      const headers: Record<string, string> = {};
      const accessToken = getAccessToken();
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${API_BASE_URL}${endpoint}?${queryParams.toString()}`,
        {
          method: "GET",
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}_${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Export completed", {
        description: `${reportName} exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed", {
        description: "Please try again later",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

