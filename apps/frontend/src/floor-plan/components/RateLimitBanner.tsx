import { AlertTriangle } from 'lucide-react';

/**
 * Shown below the action buttons when the rate limit is reached.
 */
export function RateLimitBanner() {
  return (
    <div className="mt-3 p-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Rate limit reached
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            You've used all 5 requests for this minute. Generation and AI optimization are
            temporarily disabled. Please try again later.
          </p>
        </div>
      </div>
    </div>
  );
}
