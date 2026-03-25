import type { Wall } from '../../../types';
import { Wall3D } from './Wall3D';

type Props = { walls: Wall[] };

export function Walls3D({ walls }: Props) {
  return (
    <>
      {walls.map((wall) => (
        <Wall3D key={`${wall.x1}-${wall.y1}-${wall.x2}-${wall.y2}`} wall={wall} />
      ))}
    </>
  );
}
