import { AlertTriangle } from 'lucide-react';

/**
 * Shown below the action buttons when the rate limit is reached.
 */
export function RateLimitBanner() {
  return (
    <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Rate limit reached
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            You've used all 5 requests for this minute. Generation and AI optimization are
            temporarily disabled. Please try again shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
