import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CurrencyBadgeProps {
  originalAmount: number;
  originalCurrency: string;
  inrAmount: number;
  className?: string;
}

export function CurrencyBadge({ originalAmount, originalCurrency, inrAmount, className }: CurrencyBadgeProps) {
  const isAlreadyINR = originalCurrency.toUpperCase() === 'INR';

  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-lg font-bold text-neutral-950 dark:text-white">
        {formatINR(inrAmount)}
      </span>
      {!isAlreadyINR && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          ({originalCurrency} {originalAmount.toFixed(2)})
        </span>
      )}
    </div>
  );
}
