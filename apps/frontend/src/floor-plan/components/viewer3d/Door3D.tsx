import { useMemo } from 'react';
import type { Door, Wall } from '../../../types';
import { WALL_HEIGHT_M, WALL_THICKNESS_M } from '../../utils/coordinates3d';
import { GRID } from '../../utils/floor-plan.utils';

type Props = { door: Door; walls: Wall[] };

// Standard door: 0.9m wide, 2.1m tall
const DOOR_WIDTH_M = 0.9;
const DOOR_HEIGHT_M = 2.1;

/** Find the wall this door sits on (closest wall segment). */
function findHostWall(door: Door, walls: Wall[]): Wall | null {
  let best: Wall | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const wall of walls) {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const lenSq = dx * dx + dy * dy;
    let dist: number;
    if (lenSq === 0) {
      dist = Math.hypot(door.x - wall.x1, door.y - wall.y1);
    } else {
      const t = Math.max(
        0,
        Math.min(1, ((door.x - wall.x1) * dx + (door.y - wall.y1) * dy) / lenSq)
      );
      dist = Math.hypot(door.x - (wall.x1 + t * dx), door.y - (wall.y1 + t * dy));
    }
    if (dist < bestDist) {
      bestDist = dist;
      best = wall;
    }
  }
  return best;
}

export function Door3D({ door, walls }: Props) {
  const { position, rotationY } = useMemo(() => {
    const host = findHostWall(door, walls);
    const posX = door.x / GRID;
    const posZ = -(door.y / GRID);
    const posY = DOOR_HEIGHT_M / 2;

    if (!host) return { position: [posX, posY, posZ] as [number, number, number], rotationY: 0 };

    const dx = host.x2 - host.x1;
    const dy = host.y2 - host.y1;
    // Reason: rotate the door frame to match the wall's direction in 3D
    const rotY = -Math.atan2(dy, dx);
    return { position: [posX, posY, posZ] as [number, number, number], rotationY: rotY };
  }, [door, walls]);

  const frameColor = '#92400e'; // warm brown — door frame

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Left post */}
      <mesh position={[-(DOOR_WIDTH_M / 2 + 0.05), 0, 0]}>
        <boxGeometry args={[0.1, DOOR_HEIGHT_M, WALL_THICKNESS_M + 0.02]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      {/* Right post */}
      <mesh position={[DOOR_WIDTH_M / 2 + 0.05, 0, 0]}>
        <boxGeometry args={[0.1, DOOR_HEIGHT_M, WALL_THICKNESS_M + 0.02]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      {/* Lintel (top bar) */}
      <mesh position={[0, DOOR_HEIGHT_M / 2 + 0.05, 0]}>
        <boxGeometry args={[DOOR_WIDTH_M + 0.2, 0.1, WALL_THICKNESS_M + 0.02]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      {/* Door panel (semi-transparent) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[DOOR_WIDTH_M, DOOR_HEIGHT_M, 0.04]} />
        <meshStandardMaterial color="#b45309" transparent opacity={0.3} />
      </mesh>
      {/* Gap fill — cover the wall behind the door with a dark void */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[DOOR_WIDTH_M - 0.02, DOOR_HEIGHT_M - 0.02, WALL_HEIGHT_M]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
