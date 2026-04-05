"use client";

import { SupplierResult } from "@/lib/types";
import { SupplierCard } from "@/components/dashboard/SupplierCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchX } from "lucide-react";

interface SupplierGridProps {
  suppliers: SupplierResult[];
}

export function SupplierGrid({ suppliers }: SupplierGridProps) {
  if (suppliers.length === 0) {
    return (
      <EmptyState 
        icon={<SearchX className="h-10 w-10 text-neutral-400" />}
        title="No suppliers found"
        description="Try adjusting your filters to see more results."
        className="bg-white dark:bg-[#050505] border border-neutral-800 dark:border-neutral-900 rounded-xl w-full py-20"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full h-fit">
      {suppliers.map(supplier => (
        <SupplierCard key={supplier.id} supplier={supplier} />
      ))}
    </div>
  );
}
