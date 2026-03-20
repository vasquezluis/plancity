# AI Integration

## Role

Enhance—not replace—the layout engine.

---

## Use Cases

- Suggest better outlet placement
- Optimize wiring paths
- Provide safety recommendations

---

## Input Example

```json
{
  "layout": {},
  "constraints": {
    "goal": "minimize cost"
  }
}
```

## Output Example

```json
{
  "suggestions": [],
  "optimized_layout": {}
}
```

## Prompt Example

Given a house layout, suggest optimal electrical placement.

Constraints:

- Outlets every 3 meters
- Switches near doors
- Minimize wiring length

Return JSON only.

## Notes

- Keep AI optional for MVP
- Use it for refinement
