import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import type { Door, GenerateResponse, Wall } from '../../../types';
import { GRID } from '../../utils/floor-plan.utils';
import { Doors3D } from './Doors3D';
import { ElectricalLayer3D } from './ElectricalLayer3D';
import { Floor3D } from './Floor3D';
import { Walls3D } from './Walls3D';

type Props = {
  walls: Wall[];
  doors: Door[];
  result: GenerateResponse | null;
  width: number;
  height: number;
};

/**
 * Compute the 3D center of the room's bounding box so the camera looks at the
 * room, not at the canvas origin (which is the top-left corner).
 * Reason: when walls don't start at (0,0) the default lookAt(0,0,0) skews the view,
 * making elements appear on the wrong side of the room.
 */
function useRoomCenter(walls: Wall[]): [number, number, number] {
  return useMemo(() => {
    if (walls.length === 0) return [0, 0, 0];
    const xs = walls.flatMap((w) => [w.x1, w.x2]);
    const ys = walls.flatMap((w) => [w.y1, w.y2]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2 / GRID;
    const cz = (Math.min(...ys) + Math.max(...ys)) / 2 / GRID;
    return [cx, 0, cz];
  }, [walls]);
}

export function ThreeDViewer({ walls, doors, result, width, height }: Props) {
  const [cx, , cz] = useRoomCenter(walls);

  // Reason: camera must sit on the same x as the room center and only offset along +z.
  // A diagonal offset (camX = cx+12, camZ = cz+12) puts the camera at 45° where the z-axis
  // (SVG y-down → Three.js -z) projects into the left/right screen direction, rotating
  // the layout 90°. A pure z-offset keeps z pointing down the screen and x pointing right.
  const camX = cx;
  const camY = 12;
  const camZ = cz + 15;

  return (
    <div
      style={{ width, height }}
      className="rounded border border-border bg-zinc-900"
      data-testid="threed-viewer"
    >
      <Canvas camera={{ position: [camX, camY, camZ], fov: 45 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[cx + 5, 20, cz + 10]} intensity={1} castShadow />
        {/* Reason: target room center so the view is properly oriented regardless of where the user drew the walls */}
        <OrbitControls makeDefault target={[cx, 0, cz]} />
        <Walls3D walls={walls} />
        <Doors3D doors={doors} walls={walls} />
        <Floor3D walls={walls} />
        {result && <ElectricalLayer3D result={result} />}
      </Canvas>
    </div>
  );
}
