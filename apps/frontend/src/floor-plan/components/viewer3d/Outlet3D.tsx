import type { Outlet } from '../../../types';
import { to3DPosition } from '../../utils/coordinates3d';

type Props = { outlet: Outlet };

// Elevation: 0.6m (standard outlet height on wall)
const OUTLET_ELEVATION = 0.6;

export function Outlet3D({ outlet }: Props) {
  const position = to3DPosition(outlet.x, outlet.y, OUTLET_ELEVATION);
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.06, 0.06, 0.12, 12]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  );
}
