# Layout Engine

## Overview

Core system responsible for:

- Placing electrical components
- Routing wires

---

## 1. Placement Logic

### Outlets

- Place every X meters along walls
- Avoid doors

### Switches

- Place near doors

### Panel

- Fixed or user-defined

---

## Example Output

```json
{
  "outlets": [{ "x": 2, "y": 0 }],
  "switches": [{ "x": 0.5, "y": 4 }],
  "panel": { "x": 0, "y": 0 }
}
```

## 2. Routing Engine

### Goal

Connect all points efficiently

### Approach

- Convert space into grid
- Walls = obstacles
- Use A\* algorithm

### Output

```json
{
  "wires": [
    [
      { "x": 0, "y": 0 },
      { "x": 2, "y": 0 }
    ]
  ]
}
```

## 3. Advanced (Optional)

- Circuit grouping
- Load balancing
