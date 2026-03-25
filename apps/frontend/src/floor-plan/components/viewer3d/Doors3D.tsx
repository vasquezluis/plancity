import type { Door, Wall } from '../../../types';
import { Door3D } from './Door3D';

type Props = { doors: Door[]; walls: Wall[] };

export function Doors3D({ doors, walls }: Props) {
  return (
    <>
      {doors.map((door) => (
        <Door3D key={`${door.x}-${door.y}`} door={door} walls={walls} />
      ))}
    </>
  );
}
