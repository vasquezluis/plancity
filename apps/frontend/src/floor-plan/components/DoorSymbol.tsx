import type { Door } from '../../types';

type Props = { door: Door };

/**
 * Architectural top-down door symbol centered at the placement point.
 * Hinge at (-10, 0), panel swings 90° upward, arc shows the sweep area.
 */
export function DoorSymbol({ door }: Props) {
  return (
    <g key={`${door.x}-${door.y}`} transform={`translate(${door.x}, ${door.y})`}>
      {/* Swing area fill */}
      <path d="M -10 0 L -10 -20 A 20 20 0 0 1 10 0 Z" fill="#fef3c7" opacity={0.55} />
      {/* Swing arc (dashed) */}
      <path
        d="M -10 -20 A 20 20 0 0 1 10 0"
        fill="none"
        stroke="#f59e0b"
        strokeWidth={1.5}
        strokeDasharray="4 2"
      />
      {/* Door panel */}
      <line
        x1={-10}
        y1={0}
        x2={-10}
        y2={-20}
        stroke="#b45309"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Door frame baseline */}
      <line x1={-13} y1={0} x2={13} y2={0} stroke="#b45309" strokeWidth={2} strokeLinecap="round" />
      {/* Hinge dot */}
      <circle cx={-10} cy={0} r={2.5} fill="#b45309" />
    </g>
  );
}
