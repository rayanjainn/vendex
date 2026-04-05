import { cn } from "@/lib/utils";
import { ReelJob } from "@/lib/types";
import { CheckCircle2, CircleDashed, Clock, Loader2, Search, XCircle } from "lucide-react";

interface StatusPillProps {
  status: ReelJob['status'];
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config: Record<string, { color: string, icon: any, label: string, spin?: boolean }> = {
    pending: { color: "bg-neutral-900 text-neutral-600 border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800", icon: Clock, label: "Pending" },
    downloading: { color: "bg-blue-50 text-neutral-400 dark:text-neutral-200 border-blue-200 dark:bg-blue-900/30 dark:text-neutral-300 dark:border-blue-800", icon: CircleDashed, label: "Downloading", spin: true },
    extracting: { color: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800", icon: Loader2, label: "Extracting", spin: true },
searching: { color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", icon: Search, label: "Searching", spin: true },
    normalizing: { color: "bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800", icon: Loader2, label: "Processing Data", spin: true },
    complete: { color: "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800", icon: CheckCircle2, label: "Complete" },
    failed: { color: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800", icon: XCircle, label: "Failed" },
  };

  const currentConfig = config[status] || config.pending;
  const { color, icon: Icon, label, spin } = currentConfig;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border", color, className)}>
      <Icon className={cn("h-3.5 w-3.5", spin && "animate-spin")} />
      {label}
    </span>
  );
}
