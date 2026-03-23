import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useTutorial } from '../../src/floor-plan-tutorial/hooks/useTutorial';

const STORAGE_KEY = 'plancity:tutorial:seen';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('useTutorial', () => {
  it('isOpen is true when localStorage key is absent (first visit)', () => {
    const { result } = renderHook(() => useTutorial());
    expect(result.current.isOpen).toBe(true);
  });

  it('isOpen is false when key is already set', () => {
    localStorage.setItem(STORAGE_KEY, '1');
    const { result } = renderHook(() => useTutorial());
    expect(result.current.isOpen).toBe(false);
  });

  it('close() sets the localStorage key and flips isOpen to false', () => {
    const { result } = renderHook(() => useTutorial());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());

    expect(result.current.isOpen).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
  });

  it('calling close() twice is idempotent — no error thrown', () => {
    const { result } = renderHook(() => useTutorial());
    act(() => result.current.close());
    expect(() => act(() => result.current.close())).not.toThrow();
    expect(result.current.isOpen).toBe(false);
  });

  it('open() re-opens the modal even after close()', () => {
    const { result } = renderHook(() => useTutorial());
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });
});
