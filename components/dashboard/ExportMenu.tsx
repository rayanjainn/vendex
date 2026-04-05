"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { SupplierResult } from "@/lib/types";

export function ExportMenu({ suppliers }: { suppliers: SupplierResult[] }) {
  const handleExport = (format: string) => {
    toast.success(`Exported ${suppliers.length} results as ${format}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border bg-white dark:bg-neutral-950 dark:border-neutral-800 hover:bg-neutral-950 dark:hover:bg-neutral-900 h-8 px-3 gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Export Data
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 border-neutral-800 dark:border-neutral-900 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-800">
        <DropdownMenuItem className="focus:bg-neutral-900 dark:focus:bg-neutral-900 cursor-pointer" onClick={() => handleExport('CSV')}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem className="focus:bg-neutral-900 dark:focus:bg-neutral-900 cursor-pointer" onClick={() => handleExport('Excel')}>Export as Excel</DropdownMenuItem>
        <DropdownMenuItem className="focus:bg-neutral-900 dark:focus:bg-neutral-900 cursor-pointer" onClick={() => handleExport('JSON')}>Export as JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
