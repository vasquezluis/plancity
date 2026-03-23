import type { Point } from '../../../types';
import { to3DPosition } from '../../utils/coordinates3d';

type Props = { panel: Point };

// Elevation: 0.9m — center of the panel box which is 0.6m tall (0.6 to 1.2m range)
const PANEL_ELEVATION = 0.9;

export function Panel3D({ panel }: Props) {
  const position = to3DPosition(panel.x, panel.y, PANEL_ELEVATION);
  return (
    <mesh position={position}>
      <boxGeometry args={[0.4, 0.6, 0.1]} />
      <meshStandardMaterial color="#10b981" />
    </mesh>
  );
}
