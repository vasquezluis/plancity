import { useCallback, useState } from 'react';

const STORAGE_KEY = 'plancity:tutorial:seen';

export type UseTutorialReturn = {
  isOpen: boolean;
  open: () => void;
  /** Marks the tutorial as seen in localStorage and closes the modal */
  close: () => void;
};

export function useTutorial(): UseTutorialReturn {
  // Reason: absence of key = first visit, matching the useTheme.ts localStorage pattern
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem(STORAGE_KEY) === null);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    setIsOpen(false);
  }, []);

  return { isOpen, open, close };
}
