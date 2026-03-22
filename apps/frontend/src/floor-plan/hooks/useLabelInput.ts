import { useState } from 'react';
import type { Label, Point } from '../../types';

export type UseLabelInputReturn = {
  pendingLabel: Point | null;
  labelText: string;
  setLabelText: (text: string) => void;
  startLabel: (pos: Point) => void;
  confirmLabel: () => void;
  cancelLabel: () => void;
};

/** Manages the state for placing an inline text label on the canvas. */
export function useLabelInput(
  labels: Label[],
  onLabelsChange: (labels: Label[]) => void
): UseLabelInputReturn {
  const [pendingLabel, setPendingLabel] = useState<Point | null>(null);
  const [labelText, setLabelText] = useState('');

  function startLabel(pos: Point) {
    setPendingLabel(pos);
    setLabelText('');
  }

  function confirmLabel() {
    if (pendingLabel && labelText.trim()) {
      onLabelsChange([...labels, { x: pendingLabel.x, y: pendingLabel.y, text: labelText.trim() }]);
    }
    setPendingLabel(null);
    setLabelText('');
  }

  function cancelLabel() {
    setPendingLabel(null);
    setLabelText('');
  }

  return { pendingLabel, labelText, setLabelText, startLabel, confirmLabel, cancelLabel };
}
