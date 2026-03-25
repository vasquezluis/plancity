# Context

PlanCity currently renders its electrical floor plan exclusively in a 2D SVG canvas. The final phase of the
project is a 3D viewer that transforms the same floor plan data into an interactive 3D house
representation — semi-transparent walls so the user can see electrical wiring, outlets, switches, and the
panel from any angle. The toggle should be non-destructive: switching back to 2D restores the full editor.

---

Libraries to Add (frontend only)

pnpm --filter @cubepath/frontend add three @react-three/fiber @react-three/drei @types/three

- @react-three/fiber — React renderer for Three.js (JSX-based scene)
- @react-three/drei — Helpers: OrbitControls, Line (dashed wires)
- three + @types/three — Core 3D engine + TypeScript types

---

Coordinate Conversion

| 2D SVG    | Three.js 3D                                     |
| --------- | ----------------------------------------------- |
| x (px)    | x / 40 (meters, right)                          |
| y (px)    | -(y / 40) (meters, depth — SVG y-down → Z-axis) |
| elevation | y axis in Three.js                              |

- Scale: GRID = 40 px/meter (from existing floor-plan.utils.ts)
- Wall height: 2.4m (standard room)
- Wall thickness: 0.1m (decorative)

---

New Files

```
 apps/frontend/src/floor-plan/
   utils/
     coordinates3d.ts                  ← to3DPosition(), wallGeometry() — no Three.js dependency
   components/
     viewer3d/
       ThreeDViewer.tsx                ← R3F Canvas wrapper + lights + OrbitControls
       Walls3D.tsx                     ← Maps Wall[] → <Wall3D>
       Wall3D.tsx                      ← Single wall BoxGeometry (semi-transparent gray)
       Floor3D.tsx                     ← PlaneGeometry from bounding box of walls
       ElectricalLayer3D.tsx           ← Composes all electrical 3D elements
       Outlet3D.tsx                    ← CylinderGeometry, blue, y=0.6
       Switch3D.tsx                    ← BoxGeometry, pink, y=1.2
       Wire3D.tsx                      ← drei <Line> dashed amber, y=0.05
       Panel3D.tsx                     ← Tall BoxGeometry, green, y=0.3
 apps/frontend/tests/floor-plan/
   coordinates3d.test.ts               ← Pure unit tests (no WebGL)
   ThreeDViewer.test.tsx               ← Shallow render with mocked R3F/Drei
```

---

Modified Files

apps/frontend/src/floor-plan/types/floor-plan.types.ts

- Add ThreeDViewerProps type
- Add show3D?: boolean to DrawingCanvasProps

apps/frontend/src/floor-plan/FloorPlanEditor.tsx

- Add const [show3D, setShow3D] = useState(false)
- Add toggle button ("3D View" / "2D View") in the actions row — only shown when walls exist or result is
  available
- Pass show3D prop to <DrawingCanvas>

apps/frontend/src/floor-plan/components/DrawingCanvas.tsx

- Destructure show3D prop
- Conditional render: if show3D → \<ThreeDViewer\> else \<svg\> (existing)
- Layer toggles and canvas footer hidden in 3D mode (they reference SVG-only concepts)

---

Component Details

coordinates3d.ts (pure math, testable without WebGL)

```tsx
export const WALL_HEIGHT_M = 2.4;
export const WALL_THICKNESS_M = 0.1;

export function to3DPosition(px, py, elevationM = 0): [number, number, number]
→ [px/GRID, elevationM, -py/GRID]

export function wallGeometry(wall): { position, rotationY, length }
→ center + rotation angle from atan2(dy,dx) + length in meters
```

ThreeDViewer.tsx

```tsx
- R3F <Canvas> with camera={{ position: [15, 12, 15], fov: 45 }}
- <ambientLight intensity={0.6}>
- <directionalLight position={[10,20,10]} castShadow>
- <OrbitControls makeDefault>
- <Walls3D>, <Floor3D>, {result && <ElectricalLayer3D>}
- Wrapped in <div style={{ width, height }}> matching canvas dimensions
```

Wall rendering

- BoxGeometry args: [length, WALL_HEIGHT_M, WALL_THICKNESS_M]
- MeshStandardMaterial: color #94a3b8, transparent: true, opacity: 0.35
- Position at wall center midpoint, rotated by wallGeometry().rotationY

Electrical elements

| Element | Geometry                          | Color   | Elevation (y) |
| ------- | --------------------------------- | ------- | ------------- |
| Outlet  | CylinderGeometry(0.05, 0.05, 0.1) | #3b82f6 | 0.6m          |
| Switch  | BoxGeometry(0.1, 0.15, 0.05)      | #f472b6 | 1.2m          |
| Wire    | drei <Line> dashed                | #f59e0b | 0.05m         |
| Panel   | BoxGeometry(0.4, 0.6, 0.1)        | #10b981 | 0.3m          |

Floor

- Derive bounding box (min/max x,z) from all wall endpoints
- PlaneGeometry(width+2, depth+2) at y = 0, rotated -Math.PI/2
- Color: #1e293b (dark floor)

---

Toggle Button

```tsx
Placed after "Optimize with AI" button, only when walls.length > 0
<Button variant={show3D ? 'default' : 'outline'} onClick={() => setShow3D(v => !v)}>
  <Box className="w-4 h-4" />
  {show3D ? '2D View' : '3D View'}
</Button>
```

Uses the Box icon from lucide-react (already a dependency).

---

Tests

coordinates3d.test.ts (pure Vitest, no DOM)

- to3DPosition: origin, y-negation, elevation
- wallGeometry: horizontal wall center, length in meters, zero rotation
- wallGeometry: vertical wall rotation = π/2
- wallGeometry: zero-length wall no NaN

ThreeDViewer.test.tsx (mock R3F + Drei)

```tsx
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }) => <div data-testid="r3f-canvas">{children}</div>,
}));
vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  Line: () => null,
}));
```

- Renders canvas container at correct dimensions
- Shows ThreeDViewer when show3D=true, hides when false
- ElectricalLayer3D renders correct count of outlet/switch/wire/panel elements

---

Implementation Order

1.  Install three @react-three/fiber @react-three/drei @types/three
2.  Create coordinates3d.ts + coordinates3d.test.ts — validate math first
3.  Create ThreeDViewer.tsx with a test cube to confirm WebGL works
4.  Create Wall3D.tsx + Walls3D.tsx + Floor3D.tsx
5.  Wire toggle into FloorPlanEditor.tsx + DrawingCanvas.tsx
6.  Create all electrical components (Outlet3D, Switch3D, Wire3D, Panel3D, ElectricalLayer3D)
7.  Create ThreeDViewer.test.tsx
8.  Polish: camera, materials, background color

---

Verification

1.  pnpm --filter @cubepath/frontend test — all tests pass
2.  Draw walls and doors in the editor
3.  Click "Generate" to get electrical layout
4.  Click "3D View" button — scene renders with semi-transparent walls
5.  Orbit (drag), pan (right-click drag), zoom (scroll) work
6.  Wires, outlets, switches, panel visible inside the walls
7.  Click "2D View" — returns to full SVG editor with all state intact
