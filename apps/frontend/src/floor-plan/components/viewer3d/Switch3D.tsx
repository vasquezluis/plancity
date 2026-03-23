import type { Switch } from '../../../types';
import { to3DPosition } from '../../utils/coordinates3d';

type Props = { sw: Switch };

// Elevation: 1.2m (standard light switch height)
const SWITCH_ELEVATION = 1.2;

export function Switch3D({ sw }: Props) {
  const position = to3DPosition(sw.x, sw.y, SWITCH_ELEVATION);
  return (
    <mesh position={position}>
      <boxGeometry args={[0.1, 0.15, 0.05]} />
      <meshStandardMaterial color="#f472b6" />
    </mesh>
  );
}
