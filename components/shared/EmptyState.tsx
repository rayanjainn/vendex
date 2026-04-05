import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-900 text-neutral-500 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
