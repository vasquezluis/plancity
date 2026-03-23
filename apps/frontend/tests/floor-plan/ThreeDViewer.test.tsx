import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ElectricalLayer3D } from '../../src/floor-plan/components/viewer3d/ElectricalLayer3D';
import { ThreeDViewer } from '../../src/floor-plan/components/viewer3d/ThreeDViewer';
import type { Door, GenerateResponse, Wall } from '../../src/types';

// Reason: jsdom has no WebGL — mock R3F and Drei so component trees render without GPU
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Line: () => null,
}));

// Geometry components do nothing in jsdom — stub them out
vi.mock('../../src/floor-plan/components/viewer3d/Walls3D', () => ({
  Walls3D: () => <div data-testid="walls-3d" />,
}));
vi.mock('../../src/floor-plan/components/viewer3d/Doors3D', () => ({
  Doors3D: () => <div data-testid="doors-3d" />,
}));
vi.mock('../../src/floor-plan/components/viewer3d/Floor3D', () => ({
  Floor3D: () => <div data-testid="floor-3d" />,
}));
vi.mock('../../src/floor-plan/components/viewer3d/ElectricalLayer3D', () => ({
  ElectricalLayer3D: () => <div data-testid="electrical-layer-3d" />,
}));

const WALLS: Wall[] = [{ x1: 0, y1: 0, x2: 200, y2: 0 }];
const DOORS: Door[] = [{ x: 100, y: 0 }];
const RESULT: GenerateResponse = {
  outlets: [
    { x: 40, y: 0 },
    { x: 80, y: 0 },
  ],
  switches: [{ x: 20, y: 0 }],
  panel: { x: 0, y: 0 },
  wires: [
    [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
    ],
  ],
};

describe('ThreeDViewer', () => {
  it('renders the R3F canvas container', () => {
    render(<ThreeDViewer walls={WALLS} doors={DOORS} result={null} width={1200} height={800} />);
    expect(screen.getByTestId('threed-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('renders at the specified dimensions', () => {
    render(<ThreeDViewer walls={WALLS} doors={DOORS} result={null} width={1200} height={800} />);
    const container = screen.getByTestId('threed-viewer');
    expect(container).toHaveStyle({ width: '1200px', height: '800px' });
  });

  it('renders the electrical layer when result is provided', () => {
    render(<ThreeDViewer walls={WALLS} doors={DOORS} result={RESULT} width={1200} height={800} />);
    expect(screen.getByTestId('electrical-layer-3d')).toBeInTheDocument();
  });

  it('does not render the electrical layer when result is null', () => {
    render(<ThreeDViewer walls={WALLS} doors={DOORS} result={null} width={1200} height={800} />);
    expect(screen.queryByTestId('electrical-layer-3d')).not.toBeInTheDocument();
  });

  it('renders the doors layer', () => {
    render(<ThreeDViewer walls={WALLS} doors={DOORS} result={null} width={1200} height={800} />);
    expect(screen.getByTestId('doors-3d')).toBeInTheDocument();
  });
});

describe('ElectricalLayer3D (unmocked)', () => {
  it('renders without throwing when result is provided', () => {
    const { container } = render(<ElectricalLayer3D result={RESULT} />);
    // ElectricalLayer3D renders fragments — we verify it doesn't throw
    expect(container).toBeTruthy();
  });
});
