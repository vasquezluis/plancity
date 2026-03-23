import { useMemo } from 'react';
import type { Wall } from '../../../types';
import { GRID } from '../../utils/floor-plan.utils';

type Props = { walls: Wall[] };

export function Floor3D({ walls }: Props) {
  const { cx, cz, width, depth } = useMemo(() => {
    if (walls.length === 0) {
      return { cx: 0, cz: 0, width: 30, depth: 20 };
    }
    const xs = walls.flatMap((w) => [w.x1, w.x2]);
    const ys = walls.flatMap((w) => [w.y1, w.y2]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      cx: (minX + maxX) / 2 / GRID,
      cz: -((minY + maxY) / 2) / GRID,
      width: (maxX - minX) / GRID + 4, // +4m padding
      depth: (maxY - minY) / GRID + 4,
    };
  }, [walls]);

  return (
    <mesh position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}
