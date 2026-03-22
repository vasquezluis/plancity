import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { routeWires } from '../layout/layout.engine.js';
import type { AiAnalysisInput, AiEnhancedResponse } from './ai.schema.js';
import { AiOptimizedLayoutSchema } from './ai.schema.js';

// Base scale: 40 pixels = 1 meter (matches OUTLET_SPACING = 60px ≈ 1.5m)
const PX_PER_M = 40;
// 1 foot = 0.3048 meters
const M_PER_FT = 0.3048;

type Unit = 'm' | 'ft';

/** Pixels → display unit string, e.g. "2.50m" or "8.20ft" */
function fmt(pixels: number, unit: Unit): string {
  const value = unit === 'm' ? pixels / PX_PER_M : pixels / (PX_PER_M * M_PER_FT);
  return `${value.toFixed(2)}${unit}`;
}

/** Display-unit value → pixels (used to convert the AI response back) */
function unitToPx(value: number, unit: Unit): number {
  const meters = unit === 'm' ? value : value * M_PER_FT;
  return Math.round(meters * PX_PER_M);
}

function buildPrompt(input: AiAnalysisInput): string {
  const { walls, doors, outlets, switches, panel, unit } = input;

  // Recommended outlet spacing per unit system
  const spacingRule = unit === 'm' ? '~3m' : '~10ft';
  // Switch clearance per unit system
  const switchRule = unit === 'm' ? '1m' : '3ft';

  const wallList = walls
    .map(
      (w, i) =>
        `  Wall ${i + 1}: (${fmt(w.x1, unit)}, ${fmt(w.y1, unit)}) → (${fmt(w.x2, unit)}, ${fmt(w.y2, unit)})`
    )
    .join('\n');

  const outletList =
    outlets.map((o) => `(${fmt(o.x, unit)}, ${fmt(o.y, unit)})`).join(', ') || 'none';
  const switchList =
    switches.map((s) => `(${fmt(s.x, unit)}, ${fmt(s.y, unit)})`).join(', ') || 'none';
  const doorList = doors.map((d) => `(${fmt(d.x, unit)}, ${fmt(d.y, unit)})`).join(', ') || 'none';

  return `You are optimizing an electrical floor plan layout. All coordinates are in ${unit === 'm' ? 'meters' : 'feet'}.

WALLS (all outlet/switch positions must lie exactly on a wall segment):
${wallList}

CURRENT LAYOUT:
- Panel: (${fmt(panel.x, unit)}, ${fmt(panel.y, unit)})
- Outlets (${outlets.length}): ${outletList}
- Switches (${switches.length}): ${switchList}
- Doors: ${doorList}
- Total wires: ${input.wires.length}

RULES:
1. Outlets must be placed directly on a wall segment (between its two endpoints)
2. Spacing between outlets on the same wall should be ${spacingRule}
3. Each door must have exactly one switch placed within ${switchRule} along the same wall
4. Place the panel on a wall endpoint (corner) to minimize total wire length
5. Keep the same number of outlets and switches unless a clear improvement requires adding/removing one

Return the complete optimized layout in ${unit === 'm' ? 'meters' : 'feet'}. For each change you make, describe it concisely (e.g. "Moved outlet from (2.50${unit}, 0.00${unit}) to (3.00${unit}, 0.00${unit}) to improve spacing"). At the end explain why this layout is better.`;
}

export async function analyzeLayout(input: AiAnalysisInput): Promise<AiEnhancedResponse> {
  const unit = input.unit ?? 'm';

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: AiOptimizedLayoutSchema,
    system:
      'You are a licensed electrical engineer optimizing residential wiring layouts. Return only valid JSON matching the schema.',
    prompt: buildPrompt(input),
  });

  // Convert AI coordinates (in the user's unit) back to pixels for the layout engine
  const outlets = object.outlets.map((p) => ({ x: unitToPx(p.x, unit), y: unitToPx(p.y, unit) }));
  const switches = object.switches.map((p) => ({ x: unitToPx(p.x, unit), y: unitToPx(p.y, unit) }));
  const panel = { x: unitToPx(object.panel.x, unit), y: unitToPx(object.panel.y, unit) };

  // Re-route wires from the AI-optimized positions using the existing A* engine
  const wires = routeWires(outlets, switches, panel, input.walls);

  return {
    outlets,
    switches,
    panel,
    wires,
    changes: object.changes,
    explanation: object.explanation,
  };
}
