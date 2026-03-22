import { Sparkles } from 'lucide-react';

type Props = {
  changes: string[] | null;
  explanation: string | null;
  isPending: boolean;
  error: string | null;
};

export function AiPanel({ changes, explanation, isPending, error }: Props) {
  if (isPending) {
    return (
      <div className="mt-3 p-3 rounded-md border border-border bg-muted/30 animate-pulse">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">AI is optimizing the layout…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="mt-2 text-sm text-destructive">AI error: {error}</p>;
  }

  if (!changes) return null;

  if (changes.length === 0) {
    return (
      <div className="mt-3 p-3 rounded-md border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Layout is already optimal — no changes made.
          </span>
        </div>
        {explanation && <p className="text-sm text-muted-foreground">{explanation}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 rounded-md border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20 space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
          AI applied {changes.length} change{changes.length !== 1 ? 's' : ''}
        </span>
      </div>

      <ol className="space-y-1">
        {changes.map((change, i) => (
          // Reason: index is stable — list is immutable once rendered from a single AI response
          // biome-ignore lint/suspicious/noArrayIndexKey: immutable AI response list
          <li key={i} className="text-sm flex gap-2">
            <span className="text-purple-500 font-medium shrink-0">{i + 1}.</span>
            <span>{change}</span>
          </li>
        ))}
      </ol>

      {explanation && (
        <p className="text-sm text-purple-800 border-t border-purple-200 dark:border-purple-800 pt-2">
          {explanation}
        </p>
      )}
    </div>
  );
}
