import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { Door, GenerateResponse, Wall } from '../../types';
import { postPlan } from '../api/floor-plan.api';
import type { PlanResponse, RateLimitInfo } from '../types/floor-plan.types';

const DEFAULT_RATE_LIMIT: RateLimitInfo = { limit: 3, remaining: 3, resetAt: 0 };

export function useFloorPlan() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo>(DEFAULT_RATE_LIMIT);
  // Seconds until rate limit window resets (only when remaining === 0)
  const [retryIn, setRetryIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown ticker when the user is rate-limited
  useEffect(() => {
    if (rateLimit.remaining > 0 || rateLimit.resetAt === 0) {
      setRetryIn(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const tick = () => {
      const secs = Math.max(0, rateLimit.resetAt - Math.floor(Date.now() / 1000));
      setRetryIn(secs);
      if (secs === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Optimistically restore remaining count so the button re-enables
        setRateLimit((prev) => ({ ...prev, remaining: prev.limit }));
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rateLimit.remaining, rateLimit.resetAt]);

  const {
    mutate,
    data: planResponse,
    isPending,
    error,
    reset,
  } = useMutation<PlanResponse, Error, { walls: Wall[]; doors: Door[] }>({
    mutationFn: postPlan,
    onSuccess: (res) => {
      setRateLimit(res.rateLimit);
    },
    onError: (err) => {
      // Preserve rate limit info if it was attached to the error (429 case)
      const rl = (err as Error & { rateLimit?: RateLimitInfo }).rateLimit;
      if (rl) setRateLimit(rl);
    },
  });

  function handleGenerate() {
    if (walls.length === 0) return;
    reset();
    mutate({ walls, doors });
  }

  function handleClear() {
    setWalls([]);
    setDoors([]);
    reset();
  }

  function handleWallsChange(next: Wall[]) {
    setWalls(next);
    reset();
  }

  function handleDoorsChange(next: Door[]) {
    setDoors(next);
    reset();
  }

  const result: GenerateResponse | null = planResponse?.data ?? null;

  return {
    walls,
    doors,
    result,
    isPending,
    error,
    rateLimit,
    retryIn,
    handleGenerate,
    handleClear,
    handleWallsChange,
    handleDoorsChange,
  };
}
