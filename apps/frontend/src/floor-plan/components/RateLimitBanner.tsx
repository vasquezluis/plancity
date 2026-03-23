import { AlertTriangle, Clock } from 'lucide-react';

type Props = {
  limit: number;
  remaining: number;
  retryIn: number; // seconds until reset
};

/**
 * Shown below the action buttons when the rate limit is reached.
 * Displays a countdown and the used/available request dots.
 */
export function RateLimitBanner({ limit, remaining, retryIn }: Props) {
  const minutes = Math.floor(retryIn / 60);
  const seconds = retryIn % 60;
  const countdown = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="mt-3 p-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Rate limit reached
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            You've used all {limit} requests for this minute. Generation and AI optimization are
            temporarily disabled.
          </p>

          {/* Countdown */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
              Try again in <span className="tabular-nums font-mono">{countdown}</span>
            </span>
          </div>

          {/* Request dots */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-xs text-amber-700 dark:text-amber-400">
              {remaining}/{limit} remaining
            </span>
            <div className="flex gap-1">
              {Array.from({ length: limit }).map((_, i) => (
                <span
                  // Reason: index is stable — limit is a fixed constant
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length constant array
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < remaining ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
