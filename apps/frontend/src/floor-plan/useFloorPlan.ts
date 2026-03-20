import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { Door, GenerateResponse, Wall } from '../types';
import { postPlan } from './floor-plan.api';

export function useFloorPlan() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);

  const {
    mutate,
    data: result,
    isPending,
    error,
    reset,
  } = useMutation<GenerateResponse, Error, { walls: Wall[]; doors: Door[] }>({
    mutationFn: postPlan,
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
    handleGenerate,
    handleClear,
    handleWallsChange,
    handleDoorsChange,
  };
}
