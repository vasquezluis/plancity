import type { GenerateResponse } from '../types';

type Props = { result: GenerateResponse };

/** SVG layer rendered on top of the floor plan showing outlets, switches, wires and the panel. */
export function LayoutOverlay({ result }: Props) {
  return (
    <>
      {/* Wires drawn first so components render on top */}
      {result.wires.map((path) => (
        <polyline
          key={path.map((p) => `${p.x},${p.y}`).join('-')}
          points={path.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          strokeLinejoin="round"
          opacity={0.8}
        />
      ))}

      {result.outlets.map((o) => (
        <g key={`outlet-${o.x},${o.y}`}>
          <circle cx={o.x} cy={o.y} r={6} fill="#3b82f6" stroke="white" strokeWidth={1.5} />
          <text x={o.x + 8} y={o.y + 4} fontSize={8} fill="#1d4ed8">
            ⚡
          </text>
        </g>
      ))}

      {result.switches.map((s) => (
        <g key={`switch-${s.x},${s.y}`}>
          <rect
            x={s.x - 5}
            y={s.y - 5}
            width={10}
            height={10}
            fill="#f6339a"
            stroke="white"
            strokeWidth={1.5}
            rx={1}
          />
          <text x={s.x + 7} y={s.y + 4} fontSize={8} fill="#f6339a">
            S
          </text>
        </g>
      ))}

      <rect
        x={result.panel.x - 8}
        y={result.panel.y - 8}
        width={16}
        height={16}
        fill="#10b981"
        stroke="white"
        strokeWidth={1.5}
        rx={2}
      />
      <text
        x={result.panel.x + 10}
        y={result.panel.y + 4}
        fontSize={9}
        fill="#065f46"
        fontWeight="bold"
      >
        Panel
      </text>
    </>
  );
}
