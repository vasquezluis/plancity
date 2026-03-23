import { Line } from '@react-three/drei';
import type { Wire } from '../../../types';
import { to3DPosition } from '../../utils/coordinates3d';

type Props = { wire: Wire };

// Elevation: 0.6m — matches outlet height so wires visually connect to outlets
const WIRE_ELEVATION = 0.6;

export function Wire3D({ wire }: Props) {
  if (wire.length < 2) return null;
  const points = wire.map((p) => to3DPosition(p.x, p.y, WIRE_ELEVATION));
  return <Line points={points} color="#f59e0b" lineWidth={2} dashed dashScale={3} />;
}
