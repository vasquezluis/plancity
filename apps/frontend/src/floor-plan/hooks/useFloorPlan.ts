import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { Door, GenerateResponse, Wall } from '../../types';
import { type RateLimitedError, postPlan } from '../api/floor-plan.api';

export function useFloorPlan() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the timer on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const {
    mutate,
    data: result,
    isPending,
    error,
    reset,
  } = useMutation<GenerateResponse, Error, { walls: Wall[]; doors: Door[] }>({
    mutationFn: postPlan,
    onError: (err) => {
      const retryAfter = (err as RateLimitedError).retryAfter;
      if (retryAfter == null) return;
      // Reason: on 429, disable the button on the frontend for the duration the backend
      // reports, instead of parsing rate-limit response headers which vary by draft version.
      setIsRateLimited(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsRateLimited(false);
        reset();
      }, retryAfter * 1000);
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

  return {
    walls,
    doors,
    result: result ?? null,
    isPending,
    error,
    isRateLimited,
    handleGenerate,
    handleClear,
    handleWallsChange,
    handleDoorsChange,
  };
}
