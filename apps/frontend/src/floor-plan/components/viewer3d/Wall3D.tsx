import type { Wall } from '../../../types';
import { WALL_HEIGHT_M, WALL_THICKNESS_M, wallGeometry } from '../../utils/coordinates3d';

type Props = { wall: Wall };

export function Wall3D({ wall }: Props) {
  const { position, rotationY, length } = wallGeometry(wall);
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[length, WALL_HEIGHT_M, WALL_THICKNESS_M]} />
      {/* Reason: transparent walls let users see wiring and elements inside the structure */}
      <meshStandardMaterial color="#94a3b8" transparent opacity={0.35} />
    </mesh>
  );
}
