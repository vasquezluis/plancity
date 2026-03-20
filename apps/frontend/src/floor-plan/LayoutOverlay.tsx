import type { GenerateResponse } from '../types';

type Props = { result: GenerateResponse };

/** SVG layer rendered on top of the floor plan showing outlets, wires and the panel. */
export function LayoutOverlay({ result }: Props) {
  return (
    <>
      {/* Wires drawn first so outlets render on top */}
      {result.wires.map(([from, to], i) => (
        <line
          key={`${from.x},${from.y}-${to.x},${to.y}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.8}
        />
      ))}

      {result.outlets.map((o, i) => (
        <g key={`${o.x},${o.y}`}>
          <circle cx={o.x} cy={o.y} r={6} fill="#3b82f6" stroke="white" strokeWidth={1.5} />
          <text x={o.x + 8} y={o.y + 4} fontSize={8} fill="#1d4ed8">
            ⚡
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
