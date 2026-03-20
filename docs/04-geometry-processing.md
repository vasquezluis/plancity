# Geometry Processing Layer

## Purpose

Convert raw drawing into structured spatial data.

---

## Responsibilities

- Normalize coordinates
- Snap to grid
- Detect rooms (optional)
- Build graph representation

---

## Output Example

```json
{
  "rooms": [],
  "walls": [],
  "graph": {
    "nodes": [],
    "edges": []
  }
}
```

## Key Concepts

- Line segmentation
- Spatial relationships
- Adjacency detection

## Notes

- Keep it simple for MVP
- Rooms can be optional initially
