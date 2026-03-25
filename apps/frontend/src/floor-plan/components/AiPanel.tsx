import { AlertCircle, Sparkles } from 'lucide-react';

type Props = {
  changes: string[] | null;
  explanation: string | null;
  isPending: boolean;
  error: string | null;
};

export function AiPanel({ changes, explanation, isPending, error }: Props) {
  if (isPending) {
    return (
      <div className="p-4 rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20 animate-pulse">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm text-violet-700 dark:text-violet-300 font-medium">
            AI is optimizing the layout…
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-destructive">AI optimization failed</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!changes) return null;

  if (changes.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20 space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            Layout is already optimal — no changes made.
          </span>
        </div>
        {explanation && <p className="text-sm text-muted-foreground pl-6">{explanation}</p>}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          AI applied {changes.length} change{changes.length !== 1 ? 's' : ''}
        </span>
      </div>

      <ol className="space-y-1.5 pl-1">
        {changes.map((change, i) => (
          // Reason: index is stable — list is immutable once rendered from a single AI response
          // biome-ignore lint/suspicious/noArrayIndexKey: immutable AI response list
          <li key={i} className="text-sm flex gap-2.5 text-muted-foreground">
            <span className="text-violet-500 font-bold shrink-0 tabular-nums">{i + 1}.</span>
            <span>{change}</span>
          </li>
        ))}
      </ol>

      {explanation && (
        <p className="text-sm text-muted-foreground border-t border-violet-200 dark:border-violet-800 pt-3">
          {explanation}
        </p>
      )}
    </div>
  );
}
