import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  className?: string;
}

export function RatingStars({ rating, reviewCount, className }: RatingStarsProps) {
  if (!rating || rating === 0) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span className="text-xs text-neutral-400 dark:text-neutral-600">No rating</span>
      </div>
    );
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex text-amber-500">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-3.5 w-3.5 fill-current" />
        ))}
        {hasHalfStar && <StarHalf className="h-3.5 w-3.5 fill-current" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600" />
        ))}
      </div>
      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-300">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">({reviewCount})</span>
      )}
    </div>
  );
}
