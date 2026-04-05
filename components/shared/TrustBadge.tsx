import { ShieldCheck, Award, CheckCircle, PackageCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustBadgeType = 'verified_supplier' | 'gold_supplier' | 'trade_assurance' | 'sample_available' | 'warranty';

interface TrustBadgeProps {
  type: TrustBadgeType;
  label?: string;
  className?: string;
}

export function TrustBadge({ type, label, className }: TrustBadgeProps) {
  const configs = {
    verified_supplier: { icon: CheckCircle, defaultLabel: "Verified", color: "text-blue-700 bg-blue-50 border-blue-200 dark:text-neutral-300 dark:bg-blue-900/30 dark:border-blue-800" },
    gold_supplier: { icon: Award, defaultLabel: "Gold Supplier", color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800" },
    trade_assurance: { icon: ShieldCheck, defaultLabel: "Trade Assurance", color: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-800" },
    sample_available: { icon: PackageCheck, defaultLabel: "Sample", color: "text-neutral-300 bg-neutral-900 border-neutral-800 dark:text-neutral-400 dark:bg-emerald-900/30 dark:border-emerald-800" },
    warranty: { icon: Wrench, defaultLabel: "Warranty", color: "text-neutral-800 bg-neutral-900 border-neutral-800 dark:text-neutral-300 dark:bg-neutral-900 dark:border-neutral-800" }
  };

  const { icon: Icon, defaultLabel, color } = configs[type];

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border", color, className)} title={defaultLabel}>
      <Icon className="h-3 w-3" />
      {label || defaultLabel}
    </span>
  );
}
