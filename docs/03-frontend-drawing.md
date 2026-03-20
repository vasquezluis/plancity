# Frontend Drawing Tool

## Goals

Allow users to quickly sketch a floor plan.

---

## Features

- Draw walls (lines)
- Add doors
- Snap to grid (optional)

---

## Output Format

```json
{
  "walls": [{ "x1": 0, "y1": 0, "x2": 10, "y2": 0 }],
  "doors": [{ "x": 0, "y": 4 }]
}
```

## Suggested Stack

- React
- Canvas or SVG
- Libraries:
  - Konva.js
  - Fabric.js

## Notes

- Keep UI minimal
- Prioritize speed over precision
